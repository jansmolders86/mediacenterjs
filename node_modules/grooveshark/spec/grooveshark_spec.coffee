describe "Grooveshark", ->

  gs = undefined

  beforeEach ->
    gs = new Grooveshark('key', 'secret')

  it "exports the client constructor", ->
    expect(Grooveshark).toBeFunction()

  describe "#constructor", ->
    it "sets the key and secret from the constructor", ->
      expect(gs.key).toEqual('key')
      expect(gs.secret).toEqual('secret')

    it "defaults to no session and unauthenticated", ->
      expect(gs.sessionID).toBe(null)
      expect(gs.authenticated).toBe(false)

  describe "#ensureSessionStarted", ->
    mock = undefined

    beforeEach ->
      spyOn(gs, 'urlWithSig').andReturn("http://example.com/api.php?sig=foo")
      mock = nock("http://example.com").post('/api.php?sig=foo', {
        method: 'startSession',
        parameters: {},
        header: { wsKey: 'key' }
      }).reply(200, { result: { sessionID: 'foobar1' }})

    it "makes a request for a session ID if one doesn't exist", (done) ->
      expect(gs.sessionID).toBe(null)
      gs.ensureSessionStarted( (err) ->
        expect(gs.sessionID).toBe('foobar1')
        expect(mock.isDone()).toBe(true)
        done()
      )

    it "bypasses the request for a session ID if one exists", (done) ->
      gs.sessionID = 'baz'
      gs.ensureSessionStarted( (err) ->
        expect(gs.sessionID).toBe('baz')
        expect(mock.isDone()).toBe(false)
        done()
      )

  describe "#generateRequestBody", ->
    beforeEach ->
      spyOn(gs, 'ensureSessionStarted').andCallFake( (cb) ->
        gs.sessionID = 's3cret'
        cb(null)
      )

    it "returns the correct body structure", (done) ->
      gs.generateRequestBody('foo', {bar: "none"}, (err, body) ->
        expect(err).toBe(null)
        expect(body).toEqual({
          method: 'foo',
          parameters: { bar: 'none' },
          header: { wsKey: 'key', sessionID: 's3cret' }
        })
        expect(gs.ensureSessionStarted).toHaveBeenCalled()
        expect(gs.ensureSessionStarted.callCount).toEqual(1)

        done()
      )

    it "doesn't esure that there is a session for the 'startSession' method", (done) ->
      gs.generateRequestBody('startSession', {}, (err, body) ->
        expect(err).toBe(null)
        expect(body).toEqual({
          method: 'startSession',
          parameters: {},
          header: { wsKey: 'key' }
        })
        expect(gs.ensureSessionStarted).not.toHaveBeenCalled()
        expect(gs.ensureSessionStarted.callCount).toEqual(0)

        done()
      )

  describe "#urlWithSig", ->
    it "returns the base url with the md5 signature of the body", ->
      expectedSig = "a71d8d8238fdeae0db090640395097cd"
      expectedUrl = "https://api.grooveshark.com/ws3.php?sig=" + expectedSig

      expect(gs.urlWithSig({foobar: "baz"})).toEqual(expectedUrl)

  describe "#authenticate", ->
    mock = undefined
    request = undefined

    beforeEach ->
      gs.sessionID = "foobar1"
      spyOn(gs, 'urlWithSig').andReturn("http://example.com/api.php?sig=foo")

      request = nock("http://example.com").post('/api.php?sig=foo', {
        method: 'authenticate',
        parameters: { login: "username", password: "bed128365216c019988915ed3add75fb" },
        header: { wsKey: 'key', sessionID: 'foobar1' }
      })

    describe "failure", ->
      beforeEach ->
        mock = request.reply(200, () ->
          return JSON.stringify({ result: { }})
        )

      it "makes a request to the authenticate method with the proper params", (done) ->
        gs.authenticate('username', 'passw0rd', (err) ->
          expect(err).not.toBe(null)
          expect(err.message).toBe("Invalid username or password")
          expect(mock.isDone()).toBe(true)
          done()
        )

      it "sets the current session as authenticated", (done) ->
        gs.authenticate('username', 'passw0rd', (err) ->
          expect(gs.authenticated).toBe(false)
          expect(mock.isDone()).toBe(true)
          done()
        )

    describe "success", ->
      beforeEach ->
        mock = request.reply(200, () ->
          return JSON.stringify({ result: { success: true, UserID: 1234 }})
        )

      it "makes a request to the authenticate method with the proper params", (done) ->
        gs.authenticate('username', 'passw0rd', (err) ->
          expect(err).toBe(null)
          expect(mock.isDone()).toBe(true)
          done()
        )

      it "sets the current session as authenticated", (done) ->
        gs.authenticate('username', 'passw0rd', (err) ->
          expect(gs.authenticated).toBe(true)
          expect(mock.isDone()).toBe(true)
          done()
        )

  describe "#logout", ->
    mock = undefined

    beforeEach ->
      gs.sessionID = "foobar1"
      spyOn(gs, 'urlWithSig').andReturn("http://example.com/api.php?sig=foo")

      request = nock("http://example.com").post('/api.php?sig=foo', {
        method: 'logout',
        parameters: { },
        header: { wsKey: 'key', sessionID: 'foobar1' }
      }).reply(200, { result: { success: true } })

    it "unauthenticates the user and wipes the session", (done) ->
      gs.logout (err) ->
        expect(gs.authenticated).toBe(false)
        expect(gs.sessionID).toBe(null)
        done()
