/* eslint-disable no-undef */
const request = require("supertest");
const expect = require('chai').expect;
const sinon = require('sinon');
const decache = require('decache');
const jwt = require('jsonwebtoken');
const {Config} = require('../../src/configs/config');

describe("Hobbies API", () => {
    const API = "/api/v1/hobbies";
    const adminERP = '15030';
    const userERP = '17855';
    const existingHobby = {
        hobby_id: 1,
        hobby: 'painting'
    };
    const userToken = jwt.sign({erp: userERP}, Config.SECRET_JWT); // non expiry token
    const adminToken = jwt.sign({erp: adminERP}, Config.SECRET_JWT);

    beforeEach(() => {
        this.app = require('../../src/server').setup();
    });

    context("GET /hobbies", () => {

        it("Scenario 1: Get all hobbies request successful", async() => {
            // act
            let res = await request(this.app)
                .get(`${API}`)
                .auth(userToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            const resBody = res.body.body;
            expect(resBody).to.be.an('array');
            expect(resBody[0]).to.include.keys(['hobby_id', 'hobby']); // deep compare two objects using 'eql'
        });

        it("Scenario 2: Get all hobbies request unsuccessful", async() => {
            // arrange
            decache('../../src/server');
            const HobbyModel = require('../../src/models/hobby.model');
            const modelStub = sinon.stub(HobbyModel, 'findAll').callsFake(() => []); // return empty hobby list
            const app = require('../../src/server').setup();

            // act
            const res = await request(app)
                .get(`${API}`)
                .auth(userToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Hobbies not found');
            modelStub.restore();
        });

        it("Scenario 3: Get all hobbies request is unauthorized", async() => {
            // act
            let res = await request(this.app).get(`${API}`);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("GET /hobbies/:id", () => {
        it("Scenario 1: Get a hobby request successful", async() => {
            // act
            let res = await request(this.app)
                .get(`${API}/${existingHobby.hobby_id}`)
                .auth(userToken, { type: 'bearer' });

            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            const resBody = res.body.body;
            expect(resBody).to.include.keys(['hobby_id', 'hobby']);
            expect(resBody.hobby_id).to.be.eql(existingHobby.hobby_id); // should match initially sent id
        });

        it("Scenario 2: Get a hobby request is unsuccessful", async() => {
            // arrange
            const unknownHobbyId = 2000;

            // act
            const res = await request(this.app)
                .get(`${API}/${unknownHobbyId}`)
                .auth(userToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Hobby not found');
        });

        it("Scenario 3: Get a hobby request is unauthorized", async() => {
            // act
            let res = await request(this.app).get(`${API}/${existingHobby.hobby_id}`);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("POST /hobbies", () => {
        const hobby = 'cycling';
        
        it("Scenario 1: Create a hobby request is successful", async() => {
            // arrange
            const data = { hobby };
            const app = this.app;

            // act
            let res = await request(app)
                .post(`${API}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(201);
            expect(res.body.headers.error).to.be.equal(0);
            expect(res.body.body).to.include.keys(['hobby_id', 'affected_rows']);
            expect(res.body.body.affected_rows).to.be.equal(1);
            const newId = res.body.body.hobby_id;

            // affirm
            res = await request(app)
                .get(`${API}/${newId}`)
                .auth(userToken, { type: 'bearer' });

            expect(res.status).to.be.equal(200);
            expect(res.body.body).to.be.eql({
                hobby_id: newId,
                hobby: hobby
            });

            // cleanup
            res = await request(app)
                .delete(`${API}/${newId}`)
                .auth(adminToken, { type: 'bearer' });
            expect(res.status).to.be.equal(200);
        });

        it("Scenario 2: Create a hobby request is incorrect", async() => {
            // arrange
            const data = {
                hobbies: hobby // <-- a valid parameter name should be 'hobby'
            };

            // act
            const res = await request(this.app)
                .post(`${API}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(422);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('InvalidPropertiesException');
            const incorrectParams = res.body.headers.data.map(o => (o.param));
            expect(incorrectParams).to.include('hobby');
        });

        it("Scenario 3: Create a hobby request is forbidden", async() => {
            // arrange
            const data = { hobby };

            // act
            const res = await request(this.app)
                .post(`${API}`)
                .auth(userToken, { type: 'bearer' }) // <-- api_user token instead of admin token
                .send(data);
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 4: Create a hobby request is unauthorized", async() => {
            // arrange
            const data = { hobby };

            // act
            const res = await request(this.app)
                .post(`${API}`)
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("PATCH /hobbies/:id", () => {
        const newHobby = 'content writing';
        
        it("Scenario 1: Update a hobby request is successful", async() => {
            // arrange
            const data = { hobby: newHobby };
            const app = this.app;

            // act
            let res = await request(app)
                .patch(`${API}/${existingHobby.hobby_id}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            expect(res.body.body.rows_matched).to.be.equal(1);
            expect(res.body.body.rows_changed).to.be.equal(1);

            
            // affirm
            res = await request(app)
                .get(`${API}/${existingHobby.hobby_id}`)
                .auth(userToken, { type: 'bearer' });
            
            expect(res.status).to.be.equal(200);
            expect(res.body.body).to.be.eql({
                hobby_id: existingHobby.hobby_id,
                hobby: newHobby
            });
            
            // cleanup
            data.hobby = existingHobby.hobby;
            res = await request(app)
                .patch(`${API}/${existingHobby.hobby_id}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
            expect(res.status).to.be.equal(200);
        });

        it("Scenario 2: Update a hobby request is unsuccessful", async() => {
            // arrange
            const data = { hobby: newHobby };
            const unknownHobbyId = 2000;

            // act
            const res = await request(this.app)
                .patch(`${API}/${unknownHobbyId}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Hobby not found');
        });

        it("Scenario 3: Update a hobby request is incorrect", async() => {
            // arrange
            const data = {
                hobbies: newHobby // <-- a valid parameter name should be 'hobby'
            };

            // act
            const res = await request(this.app)
                .patch(`${API}/${existingHobby.hobby_id}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(422);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('InvalidPropertiesException');
            const incorrectParams = res.body.headers.data.map(o => (o.param));
            expect(incorrectParams).to.include('hobby');
        });

        it("Scenario 3: Update a hobby request is forbidden", async() => {
            // arrange
            const data = { hobby: newHobby };

            // act
            const res = await request(this.app)
                .patch(`${API}/${existingHobby.hobby_id}`)
                .auth(userToken, { type: 'bearer' }) // <-- api_user token instead of admin token
                .send(data);
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 4: Update a hobby request is unauthorized", async() => {
            // arrange
            const data = { hobby: newHobby };

            // act
            const res = await request(this.app)
                .patch(`${API}/${existingHobby.hobby_id}`)
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("DELETE /hobbies", () => {
        const hobby = 'cycling';
        
        it("Scenario 1: Delete a hobby request is successful", async() => {
            // prepare
            const data = { hobby };
            const app = this.app;

            // create dummy
            let res = await request(app)
                .post(`${API}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
            expect(res.status).to.be.equal(201);

            // arrange
            const newId = res.body.body.hobby_id;

            // act
            res = await request(app)
                .delete(`${API}/${newId}`)
                .auth(adminToken, { type: 'bearer' });

            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            expect(res.body.headers.message).to.be.equal('Hobby has been deleted');
            expect(res.body.body.rows_removed).to.be.equal(1);

            // affirm
            res = await request(app)
                .get(`${API}/${newId}`)
                .auth(userToken, { type: 'bearer' });
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
        });

        it("Scenario 2: Delete a hobby request is unsuccessful", async() => {
            // arrange
            const unknownHobbyId = 2000;

            // act
            const res = await request(this.app)
                .delete(`${API}/${unknownHobbyId}`)
                .auth(adminToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Hobby not found');
        });

        it("Scenario 3: Delete a hobby request is forbidden", async() => {
            // act
            const res = await request(this.app)
                .delete(`${API}/${existingHobby.hobby_id}`)
                .auth(userToken, { type: 'bearer' }); // <-- api_user token instead of admin token
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 4: Delete a hobby request is unauthorized", async() => {
            // act
            const res = await request(this.app)
                .delete(`${API}/${existingHobby.hobby_id}`);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

});