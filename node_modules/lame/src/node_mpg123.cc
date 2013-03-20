/*
 * Copyright (c) 2011, Nathan Rajlich <nathan@tootallnate.net>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

#include <v8.h>
#include <node.h>
#include <node_buffer.h>
#include "node_pointer.h"
#include "node_mpg123.h"

using namespace v8;
using namespace node;

namespace nodelame {

#define UNWRAP_MH \
  HandleScope scope; \
  mpg123_handle *mh = reinterpret_cast<mpg123_handle *>(UnwrapPointer(args[0]));

Handle<Value> node_mpg123_init (const Arguments& args) {
  HandleScope scope;
  return scope.Close(Integer::New(mpg123_init()));
}


Handle<Value> node_mpg123_exit (const Arguments& args) {
  HandleScope scope;
  mpg123_exit();
  return Undefined();
}


Handle<Value> node_mpg123_new (const Arguments& args) {
  HandleScope scope;

  // TODO: Accept an input decoder String
  int error = MPG123_OK;
  mpg123_handle *mh = mpg123_new(NULL, &error);

  Local<Value> rtn;
  if (error == MPG123_OK) {
    rtn = Local<Value>::New(WrapPointer(mh));
  } else {
    rtn = Local<Value>::New(Integer::New(error));
  }
  return scope.Close(rtn);
}


Handle<Value> node_mpg123_current_decoder (const Arguments& args) {
  UNWRAP_MH;
  const char *decoder = mpg123_current_decoder(mh);
  return scope.Close(String::New(decoder));
}


Handle<Value> node_mpg123_supported_decoders (const Arguments& args) {
  HandleScope scope;
  const char **decoders = mpg123_supported_decoders();
  int i = 0;
  Handle<Array> rtn = Array::New();
  while (*decoders != NULL) {
    rtn->Set(i++, String::New(*decoders));
    decoders++;
  }
  return scope.Close(rtn);
}


Handle<Value> node_mpg123_decoders (const Arguments& args) {
  HandleScope scope;
  const char **decoders = mpg123_decoders();
  int i = 0;
  Handle<Array> rtn = Array::New();
  while (*decoders != NULL) {
    rtn->Set(i++, String::New(*decoders));
    decoders++;
  }
  return scope.Close(rtn);
}


Handle<Value> node_mpg123_open_feed (const Arguments& args) {
  UNWRAP_MH;
  int ret = mpg123_open_feed(mh);
  return scope.Close(Integer::New(ret));
}


Handle<Value> node_mpg123_getformat (const Arguments& args) {
  UNWRAP_MH;
  long rate;
  int channels;
  int encoding;
  int ret;
  Local<Value> rtn;
  ret = mpg123_getformat(mh, &rate, &channels, &encoding);
  if (ret == MPG123_OK) {
    Local<Object> o = Object::New();
    o->Set(String::NewSymbol("raw_encoding"), Number::New(encoding));
    o->Set(String::NewSymbol("sampleRate"), Number::New(rate));
    o->Set(String::NewSymbol("channels"), Number::New(channels));
    o->Set(String::NewSymbol("signed"), Boolean::New(encoding & MPG123_ENC_SIGNED));
    o->Set(String::NewSymbol("float"), Boolean::New(encoding & MPG123_ENC_FLOAT));
    o->Set(String::NewSymbol("ulaw"), Boolean::New(encoding & MPG123_ENC_ULAW_8));
    o->Set(String::NewSymbol("alaw"), Boolean::New(encoding & MPG123_ENC_ALAW_8));
    if (encoding & MPG123_ENC_8)
      o->Set(String::NewSymbol("bitDepth"), Integer::New(8));
    else if (encoding & MPG123_ENC_16)
      o->Set(String::NewSymbol("bitDepth"), Integer::New(16));
    else if (encoding & MPG123_ENC_24)
      o->Set(String::NewSymbol("bitDepth"), Integer::New(24));
    else if (encoding & MPG123_ENC_32 || encoding & MPG123_ENC_FLOAT_32)
      o->Set(String::NewSymbol("bitDepth"), Integer::New(32));
    else if (encoding & MPG123_ENC_FLOAT_64)
      o->Set(String::NewSymbol("bitDepth"), Integer::New(64));
    rtn = o;
  } else {
    rtn = Integer::New(ret);
  }
  return scope.Close(rtn);
}


Handle<Value> node_mpg123_safe_buffer (const Arguments& args) {
  HandleScope scope;
  return scope.Close(Number::New(mpg123_safe_buffer()));
}


Handle<Value> node_mpg123_outblock (const Arguments& args) {
  UNWRAP_MH;
  return scope.Close(Number::New(mpg123_outblock(mh)));
}


Handle<Value> node_mpg123_framepos (const Arguments& args) {
  UNWRAP_MH;
  return scope.Close(Number::New(mpg123_framepos(mh)));
}


Handle<Value> node_mpg123_tell (const Arguments& args) {
  UNWRAP_MH;
  return scope.Close(Number::New(mpg123_tell(mh)));
}


Handle<Value> node_mpg123_tellframe (const Arguments& args) {
  UNWRAP_MH;
  return scope.Close(Number::New(mpg123_tellframe(mh)));
}


Handle<Value> node_mpg123_tell_stream (const Arguments& args) {
  UNWRAP_MH;
  return scope.Close(Number::New(mpg123_tell_stream(mh)));
}


Handle<Value> node_mpg123_feed (const Arguments& args) {
  UNWRAP_MH;

  // input buffer
  char *input = UnwrapPointer(args[1]);
  size_t size = args[2]->Int32Value();

  feed_req *request = new feed_req;
  request->mh = mh;
  request->in = (const unsigned char *)input;
  request->size = size;
  request->callback = Persistent<Function>::New(Local<Function>::Cast(args[3]));
  request->req.data = request;

  uv_queue_work(uv_default_loop(), &request->req,
      node_mpg123_feed_async,
      (uv_after_work_cb)node_mpg123_feed_after);

  return Undefined();
}

void node_mpg123_feed_async (uv_work_t *req) {
  feed_req *r = (feed_req *)req->data;
  r->rtn = mpg123_feed(
    r->mh,
    r->in,
    r->size
  );
}

void node_mpg123_feed_after (uv_work_t *req) {
  HandleScope scope;
  feed_req *r = (feed_req *)req->data;

  Handle<Value> argv[1];
  argv[0] = Integer::New(r->rtn);

  TryCatch try_catch;

  r->callback->Call(Context::GetCurrent()->Global(), 1, argv);

  // cleanup
  r->callback.Dispose();
  delete r;

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}


Handle<Value> node_mpg123_read (const Arguments& args) {
  UNWRAP_MH;

  // output buffer
  char *output = UnwrapPointer(args[1]);
  size_t size = args[2]->Int32Value();

  read_req *request = new read_req;
  request->mh = mh;
  request->out = (unsigned char *)output;
  request->size = size;
  request->done = 0;
  request->callback = Persistent<Function>::New(Local<Function>::Cast(args[3]));
  request->req.data = request;

  uv_queue_work(uv_default_loop(), &request->req,
      node_mpg123_read_async,
      (uv_after_work_cb)node_mpg123_read_after);

  return Undefined();
}

void node_mpg123_read_async (uv_work_t *req) {
  read_req *r = (read_req *)req->data;
  r->rtn = mpg123_read(
    r->mh,
    r->out,
    r->size,
    &r->done
  );

  /* any new metadata? */
  r->meta = mpg123_meta_check(r->mh);
}

void node_mpg123_read_after (uv_work_t *req) {
  HandleScope scope;
  read_req *r = (read_req *)req->data;

  Handle<Value> argv[3];
  argv[0] = Integer::New(r->rtn);
  argv[1] = Integer::New(r->done);
  argv[2] = Integer::New(r->meta);

  TryCatch try_catch;

  r->callback->Call(Context::GetCurrent()->Global(), 3, argv);

  // cleanup
  r->callback.Dispose();
  delete r;

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}


Handle<Value> node_mpg123_id3 (const Arguments& args) {
  UNWRAP_MH;

  id3_req *request = new id3_req;
  request->mh = mh;
  request->callback = Persistent<Function>::New(Local<Function>::Cast(args[1]));
  request->req.data = request;

  uv_queue_work(uv_default_loop(), &request->req,
      node_mpg123_id3_async,
      (uv_after_work_cb)node_mpg123_id3_after);

  return Undefined();
}

void node_mpg123_id3_async (uv_work_t *req) {
  id3_req *r = (id3_req *)req->data;
  r->rtn = mpg123_id3(
    r->mh,
    &r->v1,
    &r->v2
  );
}

void node_mpg123_id3_after (uv_work_t *req) {
  HandleScope scope;
  id3_req *ireq = (id3_req *)req->data;

  mpg123_id3v1 *v1 = ireq->v1;
  mpg123_id3v2 *v2 = ireq->v2;
  int r = ireq->rtn;
  Handle<Value> rtn;

  if (r == MPG123_OK) {
    if (v1 != NULL) {
      /* got id3v1 tags */
      Local<Object> o = Object::New();
      o->Set(String::NewSymbol("tag"), String::New(v1->tag, sizeof(v1->tag)));
      o->Set(String::NewSymbol("title"), String::New(v1->title, sizeof(v1->title)));
      o->Set(String::NewSymbol("artist"), String::New(v1->artist, sizeof(v1->artist)));
      o->Set(String::NewSymbol("album"), String::New(v1->album, sizeof(v1->album)));
      o->Set(String::NewSymbol("year"), String::New(v1->year, sizeof(v1->year)));
      if (v1->comment[28] == 0 && v1->comment[29] >= 1) {
        /* ID3v1.1 */
        o->Set(String::NewSymbol("comment"), String::New(v1->comment, sizeof(v1->comment) - 2));
        o->Set(String::NewSymbol("trackNumber"), Integer::New(v1->comment[29]));
      } else {
        /* ID3v1 */
        o->Set(String::NewSymbol("comment"), String::New(v1->comment, sizeof(v1->comment)));
      }
      o->Set(String::NewSymbol("genre"), Integer::New(v1->genre));
      rtn = o;
    } else if (v2 != NULL) {
      /* got id3v2 tags */
      mpg123_string *s;
      mpg123_text *t;
      Local<Object> o = Object::New();
      Local<Array> a;
      Local<Object> text;
#define SET(prop) \
      s = v2->prop; \
      if (s != NULL) \
        o->Set(String::NewSymbol(#prop), String::New(s->p, s->fill));
      SET(title)
      SET(artist)
      SET(album)
      SET(year)
      SET(genre)
      SET(comment)
#undef SET

#define SET_ARRAY(array, count) \
      a = Array::New(v2->count); \
      for (size_t i = 0; i < v2->count; i++) { \
        t = &v2->array[i]; \
        text = Object::New(); \
        a->Set(i, text); \
        text->Set(String::NewSymbol("lang"), String::New(t->lang, sizeof(t->lang))); \
        text->Set(String::NewSymbol("id"), String::New(t->id, sizeof(t->id))); \
        s = &t->description; \
        if (s != NULL) \
          text->Set(String::NewSymbol("description"), String::New(s->p, s->fill)); \
        s = &t->text; \
        if (s != NULL) \
          text->Set(String::NewSymbol("text"), String::New(s->p, s->fill)); \
      } \
      o->Set(String::NewSymbol(#count), a);
      SET_ARRAY(comment_list, comments)
      SET_ARRAY(text, texts)
      SET_ARRAY(extra, extras)
#undef SET_ARRAY

      rtn = o;
    } else {
      rtn = Null();
    }
  }

  Handle<Value> argv[2];
  argv[0] = Integer::New(ireq->rtn);
  argv[1] = rtn;

  TryCatch try_catch;

  ireq->callback->Call(Context::GetCurrent()->Global(), 2, argv);

  // cleanup
  ireq->callback.Dispose();
  delete ireq;

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}


void InitMPG123(Handle<Object> target) {
  HandleScope scope;

#define CONST_INT(value) \
  target->Set(String::NewSymbol(#value), Integer::New(value), \
      static_cast<PropertyAttribute>(ReadOnly|DontDelete));

  // mpg123_errors
  CONST_INT(MPG123_DONE);  /**< Message: Track ended. Stop decoding. */
  CONST_INT(MPG123_NEW_FORMAT);  /**< Message: Output format will be different on next call. Note that some libmpg123 versions between 1.4.3 and 1.8.0 insist on you calling mpg123_getformat() after getting this message code. Newer verisons behave like advertised: You have the chance to call mpg123_getformat(), but you can also just continue decoding and get your data. */
  CONST_INT(MPG123_NEED_MORE);  /**< Message: For feed reader: "Feed me more!" (call mpg123_feed() or mpg123_decode() with some new input data). */
  CONST_INT(MPG123_ERR);      /**< Generic Error */
  CONST_INT(MPG123_OK);       /**< Success */
  CONST_INT(MPG123_BAD_OUTFORMAT);   /**< Unable to set up output format! */
  CONST_INT(MPG123_BAD_CHANNEL);    /**< Invalid channel number specified. */
  CONST_INT(MPG123_BAD_RATE);    /**< Invalid sample rate specified.  */
  CONST_INT(MPG123_ERR_16TO8TABLE);  /**< Unable to allocate memory for 16 to 8 converter table! */
  CONST_INT(MPG123_BAD_PARAM);    /**< Bad parameter id! */
  CONST_INT(MPG123_BAD_BUFFER);    /**< Bad buffer given -- invalid pointer or too small size. */
  CONST_INT(MPG123_OUT_OF_MEM);    /**< Out of memory -- some malloc() failed. */
  CONST_INT(MPG123_NOT_INITIALIZED);  /**< You didn't initialize the library! */
  CONST_INT(MPG123_BAD_DECODER);    /**< Invalid decoder choice. */
  CONST_INT(MPG123_BAD_HANDLE);    /**< Invalid mpg123 handle. */
  CONST_INT(MPG123_NO_BUFFERS);    /**< Unable to initialize frame buffers (out of memory?). */
  CONST_INT(MPG123_BAD_RVA);      /**< Invalid RVA mode. */
  CONST_INT(MPG123_NO_GAPLESS);    /**< This build doesn't support gapless decoding. */
  CONST_INT(MPG123_NO_SPACE);    /**< Not enough buffer space. */
  CONST_INT(MPG123_BAD_TYPES);    /**< Incompatible numeric data types. */
  CONST_INT(MPG123_BAD_BAND);    /**< Bad equalizer band. */
  CONST_INT(MPG123_ERR_NULL);    /**< Null pointer given where valid storage address needed. */
  CONST_INT(MPG123_ERR_READER);    /**< Error reading the stream. */
  CONST_INT(MPG123_NO_SEEK_FROM_END);/**< Cannot seek from end (end is not known). */
  CONST_INT(MPG123_BAD_WHENCE);    /**< Invalid 'whence' for seek function.*/
  CONST_INT(MPG123_NO_TIMEOUT);    /**< Build does not support stream timeouts. */
  CONST_INT(MPG123_BAD_FILE);    /**< File access error. */
  CONST_INT(MPG123_NO_SEEK);     /**< Seek not supported by stream. */
  CONST_INT(MPG123_NO_READER);    /**< No stream opened. */
  CONST_INT(MPG123_BAD_PARS);    /**< Bad parameter handle. */
  CONST_INT(MPG123_BAD_INDEX_PAR);  /**< Bad parameters to mpg123_index() and mpg123_set_index() */
  CONST_INT(MPG123_OUT_OF_SYNC);  /**< Lost track in bytestream and did not try to resync. */
  CONST_INT(MPG123_RESYNC_FAIL);  /**< Resync failed to find valid MPEG data. */
  CONST_INT(MPG123_NO_8BIT);  /**< No 8bit encoding possible. */
  CONST_INT(MPG123_BAD_ALIGN);  /**< Stack aligmnent error */
  CONST_INT(MPG123_NULL_BUFFER);  /**< NULL input buffer with non-zero size... */
  CONST_INT(MPG123_NO_RELSEEK);  /**< Relative seek not possible (screwed up file offset) */
  CONST_INT(MPG123_NULL_POINTER); /**< You gave a null pointer somewhere where you shouldn't have. */
  CONST_INT(MPG123_BAD_KEY);   /**< Bad key value given. */
  CONST_INT(MPG123_NO_INDEX);  /**< No frame index in this build. */
  CONST_INT(MPG123_INDEX_FAIL);  /**< Something with frame index went wrong. */
  CONST_INT(MPG123_BAD_DECODER_SETUP);  /**< Something prevents a proper decoder setup */
  CONST_INT(MPG123_MISSING_FEATURE);  /**< This feature has not been built into libmpg123. */
  CONST_INT(MPG123_BAD_VALUE); /**< A bad value has been given, somewhere. */
  CONST_INT(MPG123_LSEEK_FAILED); /**< Low-level seek failed. */
  CONST_INT(MPG123_BAD_CUSTOM_IO); /**< Custom I/O not prepared. */
  CONST_INT(MPG123_LFS_OVERFLOW); /**< Offset value overflow during translation of large file API calls -- your client program cannot handle that large file. */

  /* mpg123_enc_enum */
  CONST_INT(MPG123_ENC_8);
  CONST_INT(MPG123_ENC_16);
  CONST_INT(MPG123_ENC_24);
  CONST_INT(MPG123_ENC_32);
  CONST_INT(MPG123_ENC_SIGNED);
  CONST_INT(MPG123_ENC_FLOAT);
  CONST_INT(MPG123_ENC_SIGNED_16);
  CONST_INT(MPG123_ENC_UNSIGNED_16);
  CONST_INT(MPG123_ENC_UNSIGNED_8);
  CONST_INT(MPG123_ENC_SIGNED_8);
  CONST_INT(MPG123_ENC_ULAW_8);
  CONST_INT(MPG123_ENC_ALAW_8);
  CONST_INT(MPG123_ENC_SIGNED_32);
  CONST_INT(MPG123_ENC_UNSIGNED_32);
  CONST_INT(MPG123_ENC_SIGNED_24);
  CONST_INT(MPG123_ENC_UNSIGNED_24);
  CONST_INT(MPG123_ENC_FLOAT_32);
  CONST_INT(MPG123_ENC_FLOAT_64);
  CONST_INT(MPG123_ENC_ANY);

  /* mpg123_channelcount */
  CONST_INT(MPG123_MONO);
  CONST_INT(MPG123_STEREO);

  /* mpg123_channels */
  CONST_INT(MPG123_LEFT);
  CONST_INT(MPG123_RIGHT);
  CONST_INT(MPG123_LR);

  CONST_INT(MPG123_ID3);
  CONST_INT(MPG123_NEW_ID3);
  CONST_INT(MPG123_ICY);
  CONST_INT(MPG123_NEW_ICY);

  NODE_SET_METHOD(target, "mpg123_init", node_mpg123_init);
  NODE_SET_METHOD(target, "mpg123_exit", node_mpg123_exit);
  NODE_SET_METHOD(target, "mpg123_new", node_mpg123_new);
  NODE_SET_METHOD(target, "mpg123_decoders", node_mpg123_decoders);
  NODE_SET_METHOD(target, "mpg123_current_decoder", node_mpg123_current_decoder);
  NODE_SET_METHOD(target, "mpg123_supported_decoders", node_mpg123_supported_decoders);
  NODE_SET_METHOD(target, "mpg123_getformat", node_mpg123_getformat);
  NODE_SET_METHOD(target, "mpg123_safe_buffer", node_mpg123_safe_buffer);
  NODE_SET_METHOD(target, "mpg123_outblock", node_mpg123_outblock);
  NODE_SET_METHOD(target, "mpg123_framepos", node_mpg123_framepos);
  NODE_SET_METHOD(target, "mpg123_tell", node_mpg123_tell);
  NODE_SET_METHOD(target, "mpg123_tellframe", node_mpg123_tellframe);
  NODE_SET_METHOD(target, "mpg123_tell_stream", node_mpg123_tell_stream);
  NODE_SET_METHOD(target, "mpg123_open_feed", node_mpg123_open_feed);
  NODE_SET_METHOD(target, "mpg123_feed", node_mpg123_feed);
  NODE_SET_METHOD(target, "mpg123_read", node_mpg123_read);
  NODE_SET_METHOD(target, "mpg123_id3", node_mpg123_id3);
}

} // nodelame namespace
