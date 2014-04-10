var fs = require('fs'),
	path = require('path'),
	should = require('should'),
	Tiapp = require('..');

var ROOT = process.cwd(),
	INVALID_TIAPP_ARGS = [123, function(){}, [1,2,3], true, false, NaN, Infinity, null],
	TIAPP_XML = path.resolve('test', 'fixtures', 'tiapp.xml'),
	TIAPP_BAD_XML = path.resolve('test', 'fixtures', 'tiapp.bad.xml'),
	TESTFIND_END = path.resolve('test', 'fixtures', 'testfind', '1', '2', '3'),
	TESTFIND_TIAPP_XML = path.resolve('test', 'fixtures', 'testfind', 'tiapp.xml'),
	INVALID_XML = ['<WTF></WTFF>', '</elem>', 'badelem></badelem>'],
	VALID_XML = [];

// custom assertions for Tiapp
should.Assertion.add('Tiapp', function() {
	this.params = { operator: 'to be a Tiapp object' };
	this.assert(this.obj && isFunction(this.obj.parse));
}, true);

should.Assertion.add('loadedTiapp', function() {
	this.params = { operator: 'to be a loaded Tiapp object' };
	this.assert(this.obj && isFunction(this.obj.parse));
	this.assert(this.obj.doc !== null && typeof this.obj.doc !== 'undefined');
	this.assert(this.obj.doc.documentElement !== null && typeof this.obj.doc.documentElement !== 'undefined');
	this.assert(this.obj.doc.documentElement.nodeName === 'ti:app');
}, true);

// test suite
describe('Tiapp', function() {

	beforeEach(function() {
		process.chdir(ROOT);
	});

	describe('#Tiapp', function() {

		it('should execute with no arguments and no tiapp.xml found', function() {
			var tiapp = new Tiapp();
			tiapp.should.be.a.Tiapp;
			should.not.exist(tiapp.doc);
		});

		it('should execute with no arguments but still find tiapp.xml', function() {
			process.chdir(TESTFIND_END);
			var tiapp = new Tiapp();
			tiapp.should.be.a.Tiapp;
			tiapp.file.should.equal(TESTFIND_TIAPP_XML);
			should.exist(tiapp.doc);
		});

		it('should execute with file', function() {
			var tiapp = new Tiapp(TIAPP_XML);
			tiapp.should.be.a.Tiapp;
			tiapp.file.should.equal(TIAPP_XML);
			tiapp.should.be.loadedTiapp;
		});

		it('should create "file" property as non-writable', function() {
			var tiapp = new Tiapp(TIAPP_XML);
			tiapp.should.be.a.Tiapp;
			tiapp.file.should.equal(TIAPP_XML);
			tiapp.should.be.loadedTiapp;
			tiapp.file = 'this should not change anything';
			tiapp.file.should.equal(TIAPP_XML);
		});

		INVALID_TIAPP_ARGS.forEach(function(arg) {
			it('should throw when executed with "' + toString(arg) + '"', function() {
				(function() {
					var tiapp = new Tiapp(arg);
				}).should.throw(/Bad argument/);
			});
		});

	});

	describe('#find', function() {

		it('should return null when no tiapp.xml is found', function() {
			should.equal(Tiapp.prototype.find(), null);
		});

		it('should find tiapp.xml in current directory', function() {
			process.chdir(path.dirname(TESTFIND_TIAPP_XML));
			Tiapp.prototype.find().should.equal(TESTFIND_TIAPP_XML);

			process.chdir(path.dirname(TIAPP_XML));
			Tiapp.prototype.find().should.equal(TIAPP_XML);
		});

		it('should find tiapp.xml in directory hierarchy', function() {
			process.chdir(path.dirname(TESTFIND_END));
			Tiapp.prototype.find().should.equal(TESTFIND_TIAPP_XML);

			process.chdir(path.join(path.dirname(TESTFIND_END), '..'));
			Tiapp.prototype.find().should.equal(TESTFIND_TIAPP_XML);
		});

	});

	describe('#load', function() {

		it('should throw if file does not exist', function() {
			var tiapp = new Tiapp();
			(function() {
				tiapp.load('./some/totally/fake/path/tiapp.xml');
			}).should.throw(/not found/);
		});

		it('should throw if file is not valid XML', function() {
			var tiapp = new Tiapp();
			(function() {
				tiapp.load(TIAPP_BAD_XML);
			}).should.throw();
		});

		it('should load given a file', function() {
			var tiapp = new Tiapp();
			tiapp.load(TIAPP_XML);
			tiapp.file.should.equal(TIAPP_XML);
			tiapp.should.be.loadedTiapp;
		});

		it('should load without a file via find()', function() {
			process.chdir(TESTFIND_END);
			var tiapp = new Tiapp();
			tiapp.load();
			tiapp.file.should.equal(TESTFIND_TIAPP_XML);
			tiapp.should.be.loadedTiapp;
		});

		INVALID_TIAPP_ARGS.forEach(function(arg) {
			it('should throw when executed with "' + toString(arg) + '"', function() {
				(function() {
					var tiapp = new Tiapp();
					tiapp.load(arg);
				}).should.throw(/Bad argument/);
			});
		});

	});

	describe('#parse', function() {

		it('should parse given xml', function() {
			var tiapp = new Tiapp();
			tiapp.parse(fs.readFileSync(TIAPP_XML, 'utf8')).should.be.loadedTiapp;
			tiapp.parse(fs.readFileSync(TESTFIND_TIAPP_XML, 'utf8')).should.be.loadedTiapp;
		});

		it('should throw if parsed document is not a tiapp.xml', function() {
			var tiapp = new Tiapp();
			(function() {
				tiapp.parse('<done></done>');
			}).should.throw(/tiapp\.xml/);
		});

		INVALID_XML.forEach(function(xml) {
			it('should throw on invalid xml "' + xml + '"', function() {
				(function() {
					var tiapp = new Tiapp();
					tiapp.parse(xml);
				}).should.throw();
			});
		});

		INVALID_TIAPP_ARGS.concat(undefined).forEach(function(arg) {
			it('should throw if xml is "' + toString(arg) + '"', function() {
				(function() {
					var tiapp = new Tiapp();
					tiapp.parse(arg);
				}).should.throw(/Bad argument/);
			});
		});

	});

});

// utils
function isFunction(o) {
	return Object.prototype.toString.call(o) === '[object Function]';
}

function toString(o) {
	if (typeof o === 'undefined') {
		return 'undefined';
	} else if (o !== o) {
		return 'NaN';
	} else if (Array.isArray(o)) {
		return '[' + o.toString() + ']';
	} else if (o === null) {
		return 'null';
	} else {
		return o !== null ? o.toString() : Object.prototype.toString.call(o);
	}
}