'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const api = require('./utils/api');
const data = require('../server/data.json');

describe('Posts', () => {
    describe('Create', () => {
        let addedId;

        it('should add a new post', () => {
            return chakram.post(api.url('posts'), {
                "userId": 1,
                "title": "Post test",
                "body": "This is a test for the POST verb.",
            }).then(response => {
                expect(response).to.have.status(201);
                expect(response.body.data.id).to.be.defined;

                addedId = response.body.data.id;
                const myPost = chakram.get(api.url('posts/' + addedId),);
                expect(myPost).to.have.status(200);
                expect(myPost).to.have.json("data.userId", 1);
                expect(myPost).to.have.json("data.title", "Post test");
                expect(myPost).to.have.json("data.body", "This is a test for the POST verb.");
                return chakram.wait();
            })
        });

        it('should not add a new row with existing ID', () => {
            return chakram.post(api.url("posts"), {
                "id": 1,
                "userId": 1,
                "title": "Post test v2",
                "body": "This is a test for the POST verb for existing ID."
            }).then(response => {
                expect(response).to.have.status(500);

                const post_with_id1 = chakram.get(api.url("posts/1"));
                expect(post_with_id1).to.have.status(200);
                expect(post_with_id1).to.have.json("data", data => {
                    expect(data.title).not.to.equal("Post test v2");
                    expect(data.body).not.to.equal("This is a test for the POST verb for existing ID.");
                });
                return chakram.wait();
            });
        });

        after(()=>{
            if (addedId) {
                return chakram.delete(api.url("posts/" + addedId));
            }
        });
    });

    describe('Read', () => {
        it('should have posts', () => {
            const response = chakram.get(api.url('posts'));
            expect(response).to.have.status(200);
            expect(response).to.have.json('data', data => {
                expect(data).to.be.instanceof(Array);
                expect(data.length).to.be.greaterThan(0);
            });
            return chakram.wait();
        });

        it('should return a post by ID', () => {
            const expectedPost = data.posts[0];

            const response = chakram.get(api.url('posts/' + expectedPost.id));
            expect(response).to.have.status(200);
            expect(response).to.have.json('data', post => {
                expect(post).to.be.defined;
                expect(post.id).to.equal(expectedPost.id);
                expect(post.userId).to.equal(expectedPost.userId);
                expect(post.title).to.equal(expectedPost.title);
                expect(post.body).to.equal(expectedPost.body);
            });
            return chakram.wait();
        });

        it('should not return post for invalid ID', () => {
            const response = chakram.get(api.url('posts/no-id-like-this'));
            return expect(response).to.have.status(404);
        });

        describe('Filtering', () => {
            it('should return a post by title', () => {
                const response = chakram.get(api.url("posts?title=qui est esse"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(1);
                    expect(data[0].title).to.equal("qui est esse");
                });
                return chakram.wait(); 
            });

            it('should ignore filtering in invalid field passed', () => {
                const response = chakram.get(api.url("posts", "genre=nature"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(100);
                });
                return chakram.wait();
            });

            it('should not return anything if impossible filter passed', () => {
                const response = chakram.get(api.url("posts", "body=nothing to see here"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
            });
        });

        describe('Paginate', () => {
            it('should return paginated data if requested', () => {
                const response = chakram.get(api.url("posts", "_page=1"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).not.to.equal(0);
                });
                return chakram.wait();
            });

            it('should return 10 results if no limit specified', () => {
                const response = chakram.get(api.url("posts", "_page=1"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(10);
                });
                return chakram.wait();
            });

            it('should not return anything for invalid limit value', () => {
                const response = chakram.get(api.url("posts", "_limit=limit"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
            });

            it('should return the first page if invalid page requested', () => {
                const response = chakram.get(api.url("posts", "_page=page"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data[0].id).to.equal(1);
                    expect(data[data.length-1].id).to.equal(10);
                });
                return chakram.wait();
            });

            it('should not return anything for page above the last', () => {
                const response = chakram.get(api.url("posts", "_page=15"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
            });
        });

        describe('Sort', () => {
            it('should sort results by any field', () => {
                const response = chakram.get(api.url("posts", "_sort=title&_order=desc"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                      const title = data.map(post => post.title); 
                      expect(title).to.be.descending;
                });
                return chakram.wait();  
            });

            it('should not sort results if invalid field passed', () => {
                const response = chakram.get(api.url("posts", "_sort=genre"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    const ids = data.map(post => post.id);
                    expect(ids).to.be.ascending;
                });
                return chakram.wait();
            });

            it('should sort results by ascending if invalid order passed', () => {
                const response = chakram.get(api.url("posts", "_sort=title&_order=növ"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                   const titles = data.map(post => post.title);
                   expect(titles).to.be.ascending; 
                });
                return chakram.wait();
            });
        });

        describe('Slice', () => {
            it('should return a slice of the whole data set', () => {
                const response = chakram.get(api.url("posts", "_start=10&_end=20"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(10);
                    expect(data[0].id).to.equal(11);
                    expect(data[data.length - 1].id).to.equal(20);
                });
                return chakram.wait();
            });

            it('should not return results if start is not valid', () => {
                const response = chakram.get(api.url("posts", "_start=-6&_limit=20"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
            });

            it('should limit end of slicing to the last item', () => {
                const response = chakram.get(api.url("posts", "_start=50&_end=303"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(50);
                    expect(data[0].id).to.equal(51);
                    expect(data[data.length - 1].id).to.equal(100);
                });
                return chakram.wait();
            });

            it('should not return any result if limits are reversed', () => {
                const response = chakram.get(api.url("posts", "_start=30&_end=5"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
            });
        });

        describe('Operators', () => {
            describe('Greater Than', () => {
                it('should return proper posts using _gte operator', () => {
                    const response = chakram.get(api.url("posts", "id_gte=15"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(86);
                        expect(data[0].id).to.equal(15);
                        expect(data[data.length - 1].id).to.equal(100);
                    });
                    return chakram.wait();
                });

                it('should not return any post if _gte used with invalid field', () => {
                    const response = chakram.get(api.url("posts", "postId_gte=15"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(0);
                    });
                    return chakram.wait();
                });
            });

            describe('Less Than', () => {
                it('should return proper posts using _lte operator', () => {
                    const response = chakram.get(api.url("posts", "id_lte=10"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(10);
                        expect(data[0].id).to.equal(1);
                        expect(data[data.length - 1].id).to.equal(10);
                    });
                    return chakram.wait();
                });

                it('should not return any post if _lte used with invalid field', () => {
                    const response = chakram.get(api.url("posts", "postId_lte=15"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(0);
                    });
                    return chakram.wait();
                });
            });

            describe('Not equal', () => {
                it('should return proper posts using _ne operator', () => {
                    const response = chakram.get(api.url("posts", "id_ne=1"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(99);
                        expect(data[0].id).to.equal(2);
                    });
                    return chakram.wait();
                });

                it('should not return any post if _ne used with invalid field', () => {
                    const response = chakram.get(api.url("posts", "postId_ne=1"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(0);
                    });
                    return chakram.wait();
                });
            });

            describe('Like', () => {
                it('should return proper posts using _like operator', () => {
                    const response = chakram.get(api.url("posts", "title_like=molestias"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(6);
                        expect(data[0].id).to.equal(3);
                        data.forEach(post => {
                            expect(post.title).to.contain("molestias");
                        });
                    });
                    return chakram.wait();
                });

                it('should not return any post if _like used with invalid field', () => {
                    const response = chakram.get(api.url("posts", "postTitle_like=molestias"));
                    expect(response).to.have.status(200);
                    expect(response).to.have.json("data", data => {
                        expect(data.length).to.equal(0);
                    });
                    return chakram.wait();
                });
            });
        });

        describe('Full-text search', () => {
            it('should return post matching to the given text', () => {
                const response = chakram.get(api.url("posts", "q=exercitationem"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(9);
                    expect(data[0].id).to.equal(3);
                    data.forEach(post => {
                        expect(JSON.stringify(post)).to.contain("exercitationem");
                    });
                });
                return chakram.wait();
            });

            it('should not return any post for impossible text', () => {
                const response = chakram.get(api.url("posts", "q=invalidSearch"));
                expect(response).to.have.status(200);
                expect(response).to.have.json("data", data => {
                    expect(data.length).to.equal(0);
                });
                return chakram.wait();
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

        it('should update existing post with given data', () => {

            return chakram.put(api.url("posts/1"), {
                "userId": 1,
                "id": 1,
                "title": "It has been modified", 
                "body": "est et itaque qui laboriosam dolor ut debitis\ncumque et et dolor\neaque enim et architecto\net quia reiciendis quis"
            }).then(response => {
                expect(response).to.have.status(200);

                const update = chakram.get(api.url("posts/1"));
                expect(update).to.have.status(200);
                expect(update).to.have.json("data", post => {
                    expect(post.title).to.equal("It has been modified");
                });
                return chakram.wait();
            });
        });

        it('should throw error if the post does not exist', () => {
            return chakram.put(api.url("posts/121"), {
                "userId": 13,
                "id": 121,
                "title": "no title", 
                "body": "nobody"
            }).then(response => {
                expect(response).to.have.status(404);
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

        it('should delete post by ID', () => {
           return chakram.delete(api.url("posts/1"))
           .then(response => {
                expect(response).to.have.status(200);
                
                const posts = chakram.get(api.url("posts"));
                expect(posts).to.have.status(200);
                expect(posts).to.have.json("data", data => {
                    data.forEach(post => {
                        expect(post.id).not.to.equal(1);
                    });
                });
                return chakram.wait();
           });
        });

        it('should throw error if the post does not exist', () => {
            const response = chakram.delete(api.url("posts/200"));
            expect(response).to.have.status(404);
            return chakram.wait();
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