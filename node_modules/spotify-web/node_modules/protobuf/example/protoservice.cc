// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

#include <pwd.h>

#include "../protobuf_for_node.h"
#include "protoservice.pb.h"

// Copy a struct passwd into a response message.
void AddEntry(pwd::EntriesResponse* response, struct passwd* pwd) {
  pwd::Entry* e = response->add_entry();
  e->set_name(pwd->pw_name);
  e->set_uid(pwd->pw_uid);
  e->set_gid(pwd->pw_gid);
  e->set_home(pwd->pw_dir);
  e->set_shell(pwd->pw_shell);
}

// Now, for demonstrational purposes, let's pretend that getpwent is
// asynchronous, i.e. calls callbacks with data.  Besides returning
// the password data, this demonstrates how to pass on call args as a
// C-style "void* data".

// Imaginary interface.
void GetpwentAsync(
    void (*cb)(struct passwd*, void*), // called for each entry
    void (*done)(void*),               // called when done
    void* data) {                      // auxiliary payload
  // Pretend for a moment this wasn't synchronous.
  struct passwd* pwd;
  while (pwd = getpwent()) cb(pwd, data);
  setpwent();
  done(data);
}


extern "C" void init(v8::Handle<v8::Object> target) {
  // Look Ma - no V8 api required!

  // Simple synchronous implementation.
  protobuf_for_node::ExportService(
      target, "sync",
      new (class : public pwd::Pwd {
        virtual void GetEntries(google::protobuf::RpcController*,
                                const pwd::EntriesRequest* request,
                                pwd::EntriesResponse* response,
                                google::protobuf::Closure* done) {
	  struct passwd* pwd;
	  while ((pwd = getpwent())) AddEntry(response, pwd);
	  setpwent();
	  done->Run();
        }
      }));

  // Asynchronous implementation.
  protobuf_for_node::ExportService(
      target, "async",
      new (class : public pwd::Pwd {
        // This is equivalent to the service call signature.
        typedef protobuf_for_node::ServiceCall<
          const pwd::EntriesRequest, pwd::EntriesResponse> Call;

        static void OnPasswd(struct passwd* pwd, void* data) {
	  AddEntry(Call::Cast(data)->response, pwd);
        }

        static void OnDone(void* data) {
          delete Call::Cast(data);  // call complete - invokes done callback
        }

        virtual void GetEntries(google::protobuf::RpcController*,
                                const pwd::EntriesRequest* request,
                                pwd::EntriesResponse* response,
                                google::protobuf::Closure* done) {
          GetpwentAsync(OnPasswd,
                        OnDone,
                        new Call(request, response, done));
        }
      }));
}
