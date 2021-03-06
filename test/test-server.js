/* eslint-disable no-unused-expressions */
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const expect = chai.expect;
const faker = require('faker');

const {TEST_DATABASE_URL} = require('../config');
const {app, runServer, closeServer} = require('../server');
const {PackList} = require('../pack-lists/');

chai.use(chaiHttp);

function seedPackList() {
  console.info('seeding packlists');
  const seedData = [...Array(10)].map(() => generatePackListData());
  return PackList.insertMany(seedData);
}

function generatePackListData(numOfItems = 10) {
  return {
    name: faker.random.words(3),
    items: [...Array(numOfItems)].map(() => {
      return {
        item: faker.random.words(1),
        packed: faker.random.number(1, 5),
        toPack: faker.random.number(6, 10),
      };
    }),
  };
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Connect to Server', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  it('should connect to the root server', function() {
    chai.request(app)
        .get('/')
        .then(function(res) {
          expect(res).to.have.status(404);
        });
  });
});

describe('PackList API Resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedPackList();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET /api/packing endpoint', function() {
    it('should return a summary of all packlists', function() {
      return chai.request(app)
          .get('/api/packing/')
          .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.have.a.lengthOf(10);

            res.body.forEach((list) => {
              const expectedKeys = ['id', 'name', 'packed', 'toPack'];
              expect(list).to.have.keys(expectedKeys);
            });
          });
    });
  });

  describe('GET /api/packing/:id endpoint', function() {
    it('should return the packlist of the id given', function() {
      let testList;
      return PackList.findOne()
          .then(function(list) {
            testList = list;
          })
          .then(function() {
            return chai.request(app)
                .get(`/api/packing/${testList.id}`);
          })
          .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;

            expect(res.body.id).to.equal(testList.id);
            expect(res.body.name).to.equal(testList.name);
            res.body.items.forEach((item) => {
              const expectedFields = ['_id', 'item', 'packed', 'toPack'];
              expect(item).to.have.keys(expectedFields);
            });
          });
    });
  });

  describe('POST /api/packing endpoint', function() {
    it('should add a new pack list', function() {
      const newList = generatePackListData();
      let count;
      return PackList.countDocuments()
          .then(function(_count) {
            count = _count;
          })
          .then(function() {
            return chai.request(app)
                .post('/api/packing')
                .send(newList);
          })
          .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.an('Object');
            expect(res.body).to.include.keys(
                ['id', 'name', 'items']
            );

            expect(res.body.name).to.equal(newList.name);
            expect(res.body.id).to.not.be.null;

            return PackList.findById(res.body.id);
          })
          .then(function(list) {
            expect(list.name).to.equal(newList.name);
            expect(list.items.length).to.equal(newList.items.length);

            return PackList.countDocuments();
          })
          .then(function(_count) {
            expect(_count).to.equal(count + 1);
          });
    });
  });

  describe('DELETE /api/packing/:id endpoint', function() {
    it('should delete a pack-list by id', function() {
      let testList;

      return PackList.findOne()
          .then(function(list) {
            testList = list;
            return chai.request(app).delete(`/api/packing/${list.id}`);
          })
          .then(function(res) {
            expect(res).to.have.status(204);
            return PackList.findById(testList.id);
          })
          .then(function(list) {
            expect(list).to.be.null;
          });
    });
  });

  describe('PUT /api/packing/:id endpoint', function() {
    it('should update the fields of a list by id', function() {
      const updateData = generatePackListData(20);

      return PackList.findOne()
          .then(function(list) {
            updateData.id = list.id;

            return chai.request(app)
                .put(`/api/packing/${updateData.id}`)
                .send(updateData);
          })
          .then(function(res) {
            expect(res).to.have.status(204);
            return PackList.findById(updateData.id);
          })
          .then(function(list) {
            expect(list.name).to.equal(updateData.name);
            expect(list.id).to.equal(updateData.id);

            expect(list.items.length).to.equal(updateData.items.length);
          });
    });
  });
});
