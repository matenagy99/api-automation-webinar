'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const api = require('./utils/api');
const data = require('../server/data.json');
const testData =  require("./posts.json");

describe('Posts', () => {
    describe('Create', () => {
        let addedId;

        testData.create.success.forEach(test => {
            it('should add a new post', () => {
                return chakram.post(api.url(test.url), test.postToCreate)
                .then(response => {
                    expect(response).to.have.status(test.status);
                    expect(response.body.data.id).to.be.defined;

                    addedId = response.body.data.id;
                    const myPost = chakram.get(api.url('posts/' + addedId),);
                    expect(myPost).to.have.status(test.expectedResult.status);
                    expect(myPost).to.have.json("data.userId", test.expectedResult.userID);
                    expect(myPost).to.have.json("data.title", test.expectedResult.title);
                    expect(myPost).to.have.json("data.body", test.expectedResult.body);
                    return chakram.wait();
                });
            });
        });

        testData.create.unsucces.forEach(test => {
            it('should not add a new row with existing ID', () => {
                return chakram.post(api.url(test.url), test.postToCreate)
                .then(response => {
                    expect(response).to.have.status(test.status);

                    const post_with_id1 = chakram.get(api.url("posts/1"));
                    expect(post_with_id1).to.have.status(test.expectedResult.status);
                    expect(post_with_id1).to.have.json("data", data => {
                        expect(data.id).to.equal(test.expectedResult.id);
                        expect(data.userId).to.equal(test.expectedResult.userId);
                        expect(data.title).to.equal(test.expectedResult.title);
                        expect(data.body).to.equal(test.expectedResult.body);
                    });
                    return chakram.wait();
                });
            });
        });
        after(()=>{
            if (addedId) {
                return chakram.delete(api.url("posts/" + addedId));
            }
        });
    });

    describe('Read', () => {
        testData.read.general.forEach(test => {
            it('should have posts', () => {
                const response = chakram.get(api.url(test.url));
                expect(response).to.have.status(test.status);
                expect(response).to.have.json('data', data => {
                    expect(data).to.be.instanceof(Array);
                    expect(data.length).to.be.greaterThan(test.length);
                });
                return chakram.wait();
            });
        });

        testData.read.postById.forEach(test => {
            it('should return a post by ID', () => {
                const response = chakram.get(api.url(test.url));
                expect(response).to.have.status(test.status);
                expect(response).to.have.json('data', post => {
                    expect(post).to.be.defined;
                    expect(post.id).to.equal(test.expectedResult.id);
                    expect(post.userId).to.equal(test.expectedResult.userId);
                    expect(post.title).to.equal(test.expectedResult.title);
                    expect(post.body).to.equal(test.expectedResult.body);
                });
                return chakram.wait();
            });
        });
        
        testData.read.postByInvalidId.forEach(test => {
            it('should not return post for invalid ID', () => {
                const response = chakram.get(api.url(test.url));
                return expect(response).to.have.status(test.status);
            });
        });

        describe('Filtering', () => {
            testData.filtering.byTitle.forEach(test => {
                it('should return a post by title', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                        expect(data[0].title).to.equal(test.expectedResult.title);
                    });
                    return chakram.wait(); 
                });
            });

            testData.filtering.invalidFieldName.forEach(test => {
                it('should ignore filtering in invalid field passed', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });

            testData.filtering.impossibleFilter.forEach(test => {
                it('should not return anything if impossible filter passed', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });
        });

        describe('Paginate', () => {
            testData.paginate.general.forEach(test => {
                it('should return paginated data if requested', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).not.to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });

            testData.paginate.withoutLimit.forEach(test => {
                it('should return 10 results if no limit specified', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });

            testData.paginate.invalidLimit.forEach(test => {
                it('should not return anything for invalid limit value', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });

            testData.paginate.invalidPage.forEach(test => {
                it('should return the first page if invalid page requested', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data[0].id).to.equal(test.expectedResult.id);
                        expect(data[data.length-1].id).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });

            testData.paginate.pageAboveLast.forEach(test => {
                it('should not return anything for page above the last', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });
        });

        describe('Sort', () => {
            testData.sort.byAnyField.forEach(test => {
                it('should sort results by any field', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        const title = data.map(post => post.title); 
                        expect(title).to.be.descending;
                    });
                    return chakram.wait();  
                });
            });

            testData.sort.invalidField.forEach(test => {
                it('should not sort results if invalid field passed', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        const ids = data.map(post => post.id);
                        expect(ids).to.be.ascending;
                    });
                    return chakram.wait();
                });
            });

            testData.sort.invalidOrder.forEach(test => {
                it('should sort results by ascending if invalid order passed', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                    const titles = data.map(post => post.title);
                    expect(titles).to.be.ascending; 
                    });
                    return chakram.wait();
                });
            });
        });

        describe('Slice', () => {
            testData.slice.sliceTheWhole.forEach(test => {
                it('should return a slice of the whole data set', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                        expect(data[0].id).to.equal(test.expectedResult.minId);
                        expect(data[data.length - 1].id).to.equal(test.expectedResult.maxId);
                    });
                    return chakram.wait();
                });
            });

            testData.slice.invalidStart.forEach(test => {
                it('should not return results if start is not valid', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });

            testData.slice.endAboveMax.forEach(test => {
                it('should limit end of slicing to the last item', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                        expect(data[0].id).to.equal(test.expectedResult.minId);
                        expect(data[data.length - 1].id).to.equal(test.expectedResult.maxId);
                    });
                    return chakram.wait();
                });
            });

            testData.slice.reversedLimits.forEach(test => {
                it('should not return any result if limits are reversed', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });
        });

        describe('Operators', () => {
            describe('Greater Than', () => {
                testData.operators.greaterThan.forEach(test => {
                    it('should return proper posts using _gte operator', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                            expect(data[0].id).to.equal(test.expectedResult.minId);
                            expect(data[data.length - 1].id).to.equal(test.expectedResult.maxId);
                        });
                        return chakram.wait();
                    });
                });

                testData.operators.greaterThanInvalidField.forEach(test => {
                    it('should not return any post if _gte used with invalid field', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                        });
                        return chakram.wait();
                    });
                });
            });

            describe('Less Than', () => {
                testData.operators.lessThan.forEach(test => {
                    it('should return proper posts using _lte operator', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                            expect(data[0].id).to.equal(test.expectedResult.minId);
                            expect(data[data.length - 1].id).to.equal(test.expectedResult.maxId);
                        });
                        return chakram.wait();
                    });
                });

                testData.operators.lessThanInvalidField.forEach(test => {
                    it('should not return any post if _lte used with invalid field', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                        });
                        return chakram.wait();
                    });
                });
            });

            describe('Not equal', () => {
                testData.operators.notEqual.forEach(test => {
                    it('should return proper posts using _ne operator', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                            expect(data[0].id).to.equal(test.expectedResult.minId);
                        });
                        return chakram.wait();
                    });
                });

                testData.operators.notEqualInvalidField.forEach(test => {
                    it('should not return any post if _ne used with invalid field', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                        });
                        return chakram.wait();
                    });
                });
            });

            describe('Like', () => {
                testData.operators.like.forEach(test => {
                    it('should return proper posts using _like operator', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                            expect(data[0].id).to.equal(test.expectedResult.minId);
                            data.forEach(post => {
                                expect(post.title).to.contain(test.expectedResult.titleContains);
                            });
                        });
                        return chakram.wait();
                    });
                });

                testData.operators.likeInvalidField.forEach(test => {
                    it('should not return any post if _like used with invalid field', () => {
                        const response = chakram.get(api.url(test.url, test.extension));
                        expect(response).to.have.status(test.status);
                        expect(response).to.have.json("data", data => {
                            expect(data.length).to.equal(test.expectedResult.length);
                        });
                        return chakram.wait();
                    });
                });
            });
        });

        describe('Full-text search', () => {
            testData.operators.fullTextSearch.forEach(test => {
                it('should return post matching to the given text', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                        expect(data[0].id).to.equal(test.expectedResult.minId);
                        data.forEach(post => {
                            expect(JSON.stringify(post)).to.contain(test.expectedResult.postContains);
                        });
                    });
                    return chakram.wait();
                });
            });

            testData.operators.fullTextSearchImpossibleText.forEach(test => {
                it('should not return any post for impossible text', () => {
                    const response = chakram.get(api.url(test.url, test.extension));
                    expect(response).to.have.status(test.status);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(test.expectedResult.length);
                    });
                    return chakram.wait();
                });
            });
        });

        describe('Relationships', () => {
            it('should embed comments for multiple posts', () => {
                const response = chakram.get(api.url("posts", "_embed=comments"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    data.forEach(post => {
                        expect(post.comments).to.be.instanceof(Array);
                        post.comments.forEach(comment => {
                            expect(comment.postId).to.equal(post.id);
                        });
                    });
                });
                return chakram.wait();
            });

            it('should embed comment for a given post', () => {
                const response = chakram.get(api.url("posts/1", "_embed=comments"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    data.comments.forEach(comment => {
                        expect(comment.postId).to.equal(1);
                    });
                });
                return chakram.wait();
            });

            it('should return comments of a post', () => {
                const response = chakram.get(api.url("posts/1/comments"));
                expect(response).to.have.status(200);
                expect(response).to.have.json('data', data => {
                    expect(data).to.be.instanceof(Array);
                    data.forEach(comment => {
                        expect(comment.postId).to.equal(1);
                    });
                });
                return chakram.wait();
            });

            it('should handle embedding request for invalid type', () => {
                const response = chakram.get(api.url("posts", "_embed=invalidThing"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    data.forEach(post => {
                        expect(post.invalidThing.length).to.equal(0);
                    });
                });
                return chakram.wait();
            });
        });
    });

    describe('Update', () => {
        const original = data.posts[0];

        testData.update.existingPost.forEach(test => {
            it('should update existing post with given data', () => {
                return chakram.put(api.url(test.url), test.body)
                .then(response => {
                    expect(response).to.have.status(test.status);

                    const update = chakram.get(api.url(test.url));
                    expect(update).to.have.status(test.status);
                    expect(update).to.have.json("data", post => {
                        expect(post.title).to.equal(test.expectedResult.title);
                    });
                    return chakram.wait();
                });
            });
        });

        testData.update.notExistingPost.forEach(test => {
            it('should throw error if the post does not exist', () => {
                return chakram.put(api.url(test.url), test.body)
                .then(response => {
                    expect(response).to.have.status(test.status);
                });
            });
        });

        after(() => {
            chakram.post(api.url("posts/1"), {
                "userId": original.userId,
                "id": original.id,
                "title": original.title,
                "body": original.body
            });
        });
    });

    describe('Delete', () => {
        const original = data.posts[0];

        testData.delete.byId.forEach(test => {
            it('should delete post by ID', () => {
                return chakram.delete(api.url(test.url))
                .then(response => {
                        expect(response).to.have.status(test.status);
                        
                        const posts = chakram.get(api.url("posts"));
                        expect(posts).to.have.status(test.status);
                        expect(posts).to.have.json("data", data => {
                            data.forEach(post => {
                                expect(post.id).not.to.equal(1);
                            });
                        });
                        return chakram.wait();
                });
            });
        });
        
        testData.delete.notExistingPost.forEach(test => {
            it('should throw error if the post does not exist', () => {
                const response = chakram.delete(api.url(test.url));
                expect(response).to.have.status(test.status);
                return chakram.wait();
            });
        });    

        after(() => {
            return chakram.post(api.url("posts"), {
                "userId": original.userId,
                "id": original.id,
                "title": original.title,
                "body": original.body
            });
        });
    });
});