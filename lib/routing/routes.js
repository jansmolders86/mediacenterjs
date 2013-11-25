{
    "index": [{
        "method": "get",
        "path": "/NAME/"
	}],
    "post": [{
        "method":"post",
        "path": "/NAME/:id*"
    }],
	"get": [{
        "method":"get",
        "path": "/NAME/:id/:optionalParam?/:action?"
    }],
	"delete": [{
        "method":"delete",
        "path": "/NAME/:id*"
    }],
	"put": [{
        "method":"put",
        "path": "/NAME/:id*"
    }]
}