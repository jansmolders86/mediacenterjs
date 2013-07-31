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

#include <v8.h>
#include <google/protobuf/service.h>
#include <google/protobuf/stubs/common.h>

namespace protobuf_for_node {
  v8::Local<v8::Function> SchemaConstructor();

  // Exports a JS object under "name" in "target" which forwards method calls to
  // the given service implementation. Currently, the rpc controller
  // will be passed as NULL. Your service is free to finish and call the "done"
  // closure asynchronously.
  // This method takes ownership of the service argument and deletes it when the JS
  // service proxy becomes unreachable.
  void ExportService(v8::Handle<v8::Object> target, const char* name, google::protobuf::Service* service);

  // When implementing services using async apis, you often need to
  // pass [request,] response and done closure through a C void*
  // user_data argument.
  // This class helps with that. It's a simple holder, plus: once you
  // delete the object, the done closure is fired.
  //
  // Usage pattern:
  //   typedef ServiceCall<XRequest, XResponse> XCall;
  //   void Service(rpc, request, response, done) {
  //     some_async_api(args, WhenDone,
  //                    (void*)new XCall(request, response, done));
  //   }
  //   void WhenDone(result, void *user_data) {
  //     XCall* call = XCall::Cast(user_data);
  //     call->response->set_xxx(result)
  //     delete call;  // triggers done->Run()
  //   }
  template <class Request, class Response>
  struct ServiceCall {
    const Request* const request;
    Response* const response;
    google::protobuf::Closure* const done;

    ServiceCall(const Request* req,
                Response* res,
                google::protobuf::Closure* d)
        : request(req), response(res), done(d) {}

    ~ServiceCall() {
      done->Run();
    }

    static ServiceCall<Request, Response>* Cast(void* user_data) {
      return static_cast<ServiceCall<Request, Response>*>(user_data);
    }
  };
}
