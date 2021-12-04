/* eslint-disable no-undef */
const request = require("supertest");
const expect = require('chai').expect;
const sinon = require('sinon');
const decache = require('decache');
const jwt = require('jsonwebtoken');
const {Config} = require('../../src/configs/config');

describe("Teachers API", () => {
    const API = `/api/${Config.API_VERSION}`;
    const baseRoute = API + "/teachers";
    const adminERP = '15030';
    const userERP = '17855';
    const existingTeacher = {
        teacher_id: 1,
        full_name: 'Waseem Arain',
        average_rating: "5.000",
        total_reviews: 1
    };
    const unknownTeacherId = 9999;
    const userToken = jwt.sign({erp: userERP}, Config.SECRET_JWT); // non expiry token
    const adminToken = jwt.sign({erp: adminERP}, Config.SECRET_JWT);

    beforeEach(() => {
        this.app = require('../../src/server').setup();
    });

    context("GET /teachers", () => {
        it("Scenario 1: Get all teachers request successful", async() => {
            // act
            let res = await request(this.app)
                .get(baseRoute)
                .auth(adminToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            const resBody = res.body.body;
            expect(resBody).to.be.an('array');
            expect(resBody[0]).to.include.all.keys(Object.keys(existingTeacher));
        });

        it("Scenario 2: Get all teachers request unsuccessful due to zero teachers", async() => {
            // arrange
            decache('../../src/server');
            const TeacherModel = require('../../src/models/teacher.model');
            const modelStub = sinon.stub(TeacherModel, 'findAll').callsFake(() => []); // return empty teacher list
            const app = require('../../src/server').setup();

            // act
            const res = await request(app)
                .get(baseRoute)
                .auth(adminToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Teachers not found');
            modelStub.restore();
        });

        it("Scenario 3: Get a teacher request is forbidden", async() => {
            // act
            const res = await request(this.app)
                .get(baseRoute)
                .auth(userToken, { type: 'bearer' }); // <-- api_user token instead of admin token
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 4: Get all teachers request is unauthorized", async() => {
            // act
            let res = await request(this.app).get(baseRoute);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("GET /teachers/:id", () => {
        it("Scenario 1: Get a teacher request successful", async() => {
            // act
            let res = await request(this.app)
                .get(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(adminToken, { type: 'bearer' });

            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            const resBody = res.body.body;
            expect(resBody).to.include.all.keys(Object.keys(existingTeacher));
            expect(resBody.teacher_id).to.be.equal(existingTeacher.teacher_id); // should match initially sent id
        });

        it("Scenario 2: Get a teacher request is unsuccessful due to unknown teacher_id", async() => {
            // act
            const res = await request(this.app)
                .get(`${baseRoute}/${unknownTeacherId}`)
                .auth(adminToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Teacher not found');
        });

        it("Scenario 3: Get a teacher request is forbidden", async() => {
            // act
            const res = await request(this.app)
                .get(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(userToken, { type: 'bearer' }); // <-- api_user token instead of admin token
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 4: Get a teacher request is unauthorized", async() => {
            // act
            let res = await request(this.app).get(`${baseRoute}/${existingTeacher.teacher_id}`);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("POST /teachers", () => {
        const full_name = 'Shams Naveed';
        
        it("Scenario 1: Create a teacher request is successful", async() => {
            // arrange
            const data = { full_name };
            const app = this.app;

            // act
            let res = await request(app)
                .post(baseRoute)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(201);
            expect(res.body.headers.error).to.be.equal(0);
            expect(res.body.body).to.include.all.keys(['teacher_id', 'affected_rows']);
            expect(res.body.body.affected_rows).to.be.equal(1);
            const newId = res.body.body.teacher_id;

            // affirm
            res = await request(app)
                .get(`${baseRoute}/${newId}`)
                .auth(adminToken, { type: 'bearer' });

            expect(res.status).to.be.equal(200);
            expect(res.body.body).to.be.eql({
                teacher_id: newId,
                average_rating: "0.000",
                total_reviews: 0,
                ...data
            });

            // cleanup
            res = await request(app)
                .delete(`${baseRoute}/${newId}`)
                .auth(adminToken, { type: 'bearer' });
            expect(res.status).to.be.equal(200);
        });
        
        it("Scenario 2: Create a teacher request is incorrect", async() => {
            // arrange
            const data = {
                full_names: full_name // <-- a valid parameter name is 'full_name'
            };

            // act
            const res = await request(this.app)
                .post(baseRoute)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(422);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('InvalidPropertiesException');
            const incorrectParams = res.body.headers.data.map(o => (o.param));
            expect(incorrectParams).to.include.all.members(['full_name']);
        });

        it("Scenario 3: Create a teacher request is forbidden", async() => {
            // arrange
            const data = { full_name };

            // act
            const res = await request(this.app)
                .post(baseRoute)
                .auth(userToken, { type: 'bearer' }) // <-- api_user token instead of admin token
                .send(data);
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 4: Create a teacher request is unauthorized", async() => {
            // arrange
            const data = { full_name };

            // act
            const res = await request(this.app)
                .post(baseRoute)
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("PATCH /teachers/:id", () => {
        const newTeacherName = 'Waseem N. Arain';
        
        it("Scenario 1: Update a teacher request is successful", async() => {
            // arrange
            const data = { full_name: newTeacherName };
            const app = this.app;

            // act
            let res = await request(app)
                .patch(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            expect(res.body.body.rows_matched).to.be.equal(1);
            expect(res.body.body.rows_changed).to.be.equal(1);

            
            // affirm
            res = await request(app)
                .get(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(adminToken, { type: 'bearer' });
            
            expect(res.status).to.be.equal(200);
            expect(res.body.body).to.be.eql({
                teacher_id: existingTeacher.teacher_id,
                full_name: newTeacherName,
                average_rating: existingTeacher.average_rating,
                total_reviews: existingTeacher.total_reviews
            });
            
            // cleanup
            data.full_name = existingTeacher.full_name;
            res = await request(app)
                .patch(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
            expect(res.status).to.be.equal(200);
        });

        it("Scenario 2: Update a teacher request is unsuccessful due to unknown teacher_id", async() => {
            // arrange
            const data = { full_name: newTeacherName };

            // act
            const res = await request(this.app)
                .patch(`${baseRoute}/${unknownTeacherId}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Teacher not found');
        });

        it("Scenario 3: Update a teacher request is incorrect", async() => {
            // arrange
            const data = {
                full_names: newTeacherName // <-- a invalid update parameter
            };

            // act
            const res = await request(this.app)
                .patch(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(422);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('InvalidPropertiesException');
            const incorrectParams = res.body.headers.data.map(o => (o.param));
            expect(incorrectParams).to.include.all.members(['full_name']);
            const incorrectMsg = res.body.headers.data.map(o => (o.msg));
            expect(incorrectMsg).to.include('Invalid updates!');
        });

        it("Scenario 4: Update a teacher request is forbidden", async() => {
            // arrange
            const data = { full_name: newTeacherName };

            // act
            const res = await request(this.app)
                .patch(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(userToken, { type: 'bearer' }) // <-- api_user token instead of admin token
                .send(data);
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 5: Update a teacher request is unauthorized", async() => {
            // arrange
            const data = { full_name: newTeacherName };

            // act
            const res = await request(this.app)
                .patch(`${baseRoute}/${existingTeacher.teacher_id}`)
                .send(data);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

    context("DELETE /teachers/:id", () => {
        const full_name = 'Shams Naveed';
        
        it("Scenario 1: Delete a teacher request is successful", async() => {
            // prepare
            const data = { full_name };
            const app = this.app;

            // create dummy
            let res = await request(app)
                .post(baseRoute)
                .auth(adminToken, { type: 'bearer' })
                .send(data);
            expect(res.status).to.be.equal(201);

            // arrange
            const newId = res.body.body.teacher_id;

            // act
            res = await request(app)
                .delete(`${baseRoute}/${newId}`)
                .auth(adminToken, { type: 'bearer' });

            // assert
            expect(res.status).to.be.equal(200);
            expect(res.body.headers.error).to.be.equal(0);
            expect(res.body.headers.message).to.be.equal('Teacher has been deleted');
            expect(res.body.body.rows_removed).to.be.equal(1);

            // affirm
            res = await request(app)
                .get(`${baseRoute}/${newId}`)
                .auth(adminToken, { type: 'bearer' });
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
        });

        it("Scenario 2: Delete a teacher request is unsuccessful due to unknown teacher_id", async() => {
            // act
            const res = await request(this.app)
                .delete(`${baseRoute}/${unknownTeacherId}`)
                .auth(adminToken, { type: 'bearer' });
    
            // assert
            expect(res.status).to.be.equal(404);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('NotFoundException');
            expect(res.body.headers.message).to.be.equal('Teacher not found');
        });

        it("Scenario 3: Delete a teacher request is forbidden", async() => {
            // act
            const res = await request(this.app)
                .delete(`${baseRoute}/${existingTeacher.teacher_id}`)
                .auth(userToken, { type: 'bearer' }); // <-- api_user token instead of admin token
            
            // assert
            expect(res.status).to.be.equal(403);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('ForbiddenException');
            expect(res.body.headers.message).to.be.equal('User unauthorized for action');
        });

        it("Scenario 4: Delete a teacher request is unauthorized", async() => {
            // act
            const res = await request(this.app)
                .delete(`${baseRoute}/${existingTeacher.teacher_id}`);
    
            // assert
            expect(res.status).to.be.equal(401);
            expect(res.body.headers.error).to.be.equal(1);
            expect(res.body.headers.code).to.be.equal('TokenMissingException');
            expect(res.body.headers.message).to.be.equal('Access denied. No token credentials sent');
        });
    });

});