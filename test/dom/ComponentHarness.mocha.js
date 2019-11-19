var expect = require('chai').expect;
var Component = require('../../lib/components').Component;
var domTestRunner = require('../../test-utils/domTestRunner');

describe('ComponentHarness', function() {
  var runner = domTestRunner.install();

  describe('renderDom', function() {
    it('returns a page object', function() {
      function Box() {}
      Box.view = {is: 'box'};
      var harness = runner.createHarness('<view is="box" />', Box);
      var page = harness.renderDom();
      expect(page).instanceof(harness.app.Page);
    });

    it('sets component property on returned object', function() {
      function Box() {}
      Box.view = {is: 'box'};
      var box = runner.createHarness('<view is="box" />', Box).renderDom().component;
      expect(box).instanceof(Box);
    });

    it('sets fragment property on returned object', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source: '<index:><div class="box"></div>'
      };
      var fragment = runner.createHarness('<view is="box" />', Box).renderDom().fragment;
      expect(fragment).instanceof(runner.window.DocumentFragment);
      expect(fragment).html('<div class="box"></div>');
    });

    it('creates child component instances', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source:
          '<index:>' +
            '<div class="box">' +
              '<view as="myClown" is="clown" />' +
            '</div>'
      };
      function Clown() {}
      Clown.view = {
        is: 'clown',
        source:
          '<index:>' +
            '<div class="clown"></div>'
      };
      var box = runner.createHarness('<view is="box" />', Box, Clown).renderDom().component;
      expect(box.myClown).instanceof(Clown);
    });

    it('will update fragments dynamically', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source:
          '<index:>' +
            '<div class="box {{if open}}open{{/if}}"></div>'
      };
      var page = runner.createHarness('<view is="box" />', Box).renderDom();
      var fragment = page.fragment;
      var component = page.component;
      expect(fragment).html('<div class="box "></div>');
      component.model.set('open', true);
      expect(fragment).html('<div class="box open"></div>');
    });

    it('will update nodes dynamically', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source:
          '<index:>' +
            '<div as="container" class="box {{if open}}open{{/if}}"></div>'
      };
      var component = runner.createHarness('<view is="box" />', Box).renderDom().component;
      var container = component.container;
      expect(container.className).equal('box ');
      component.model.set('open', true);
      expect(container.className).equal('box open');
    });

    it('removes reference to stub components on destroy', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source:
          '<index:>' +
            '<div class="box">' +
              '{{unless hideClown}}' +
                '<view is="clown" />' +
              '{{/unless}}' +
            '</div>'
      };
      var page = runner.createHarness('<view is="box" />', Box)
        .stubComponent('clown').renderDom();
      var model = page.component.model;
      expect(page.clown).instanceof(Component);
      model.set('hideClown', true);
      expect(page.clown).equal(undefined);
      model.set('hideClown', false);
      expect(page.clown).instanceof(Component);
    });

    it('removes stub components from array on destroy', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source:
          '<index:>' +
            '<div class="box">' +
              '{{if showHappy}}' +
                '<view is="clown" expression="happy" />' +
              '{{/if}}' +
              '{{if showSad}}' +
                '<view is="clown" expression="sad" />' +
              '{{/if}}' +
            '</div>'
      };
      var page = runner.createHarness('<view is="box" show-happy />', Box)
        .stubComponent({is: 'clown', asArray: 'clowns'}).renderDom();
      var clowns = page.clowns;
      var model = page.component.model;
      expect(clowns.length).equal(1);
      expect(clowns[0].model.get('expression')).equal('happy');
      model.set('showSad', true);
      expect(clowns.length).equal(2);
      expect(clowns[0].model.get('expression')).equal('happy');
      expect(clowns[1].model.get('expression')).equal('sad');
      model.set('showHappy', false);
      expect(clowns.length).equal(1);
      expect(clowns[0].model.get('expression')).equal('sad');
      model.set('showSad', false);
      expect(clowns.length).equal(0);
    });
  });

  describe('render assertion', function() {
    it('checks equivalence of HTML, DOM, and attachment rendering', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source: '<index:><div class="box"></div>'
      };
      var harness = runner.createHarness('<view is="box" />', Box);
      expect(harness).to.render();
    });

    it('fails because of non-equivalent invalid HTML', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source: '<index:><p><div></div></p>'
      };
      var harness = runner.createHarness('<view is="box" />', Box);
      expect(harness).not.to.render();
    });

    it('fails because of non-equivalent optional HTML element', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source: '<index:><table><tr><td></td></tr></table>'
      };
      var harness = runner.createHarness('<view is="box" />', Box);
      expect(harness).not.to.render();
    });

    it('checks harness HTML, DOM, and attachment rendering against html', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source: '<index:><div class="box"></div>'
      };
      var harness = runner.createHarness('<view is="box" />', Box);
      expect(harness).to.render('<div class="box"></div>');
    });

    it('fails to attach due to invalid HTML', function() {
      function Box() {}
      Box.view = {
        is: 'box',
        source: '<index:><p><div></div></p>'
      };
      var harness = runner.createHarness('<view is="box" />', Box);
      expect(harness).not.to.render('<p><div></div></p>');
    });

    it('passes with blank view', function() {
      function Box() {}
      Box.view = {is: 'box'};
      var harness = runner.createHarness('<view is="box" />', Box);
      expect(harness).to.render('');
    });
  });
});