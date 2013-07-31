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

#include <map>
#include <string>
#include <vector>
#include <iostream>
#include <sstream>

#include <node.h>
#include <node_buffer.h>
#include <node_object_wrap.h>

#include <google/protobuf/dynamic_message.h>
#include <google/protobuf/descriptor.h>
#include <google/protobuf/descriptor.pb.h>
#include <google/protobuf/service.h>

#include "protobuf_for_node.h"

using google::protobuf::Descriptor;
using google::protobuf::DescriptorPool;
using google::protobuf::DynamicMessageFactory;
using google::protobuf::FieldDescriptor;
using google::protobuf::FileDescriptorSet;
using google::protobuf::Message;
using google::protobuf::MethodDescriptor;
using google::protobuf::Reflection;
using google::protobuf::Service;
using google::protobuf::ServiceDescriptor;

using node::ObjectWrap;
using node::Buffer;

using std::map;
using std::string;
using std::vector;
using std::cerr;
using std::endl;

using v8::Array;
using v8::AccessorInfo;
using v8::Arguments;
using v8::Boolean;
using v8::Context;
using v8::Exception;
using v8::External;
using v8::Function;
using v8::FunctionTemplate;
using v8::Integer;
using v8::Handle;
using v8::HandleScope;
using v8::InvocationCallback;
using v8::Local;
using v8::NamedPropertyGetter;
using v8::Number;
using v8::Object;
using v8::ObjectTemplate;
using v8::Persistent;
using v8::Script;
using v8::String;
using v8::ThrowException;
using v8::Value;
using v8::V8;

namespace protobuf_for_node {
  const char E_NO_ARRAY[] = "Not an array";
  const char E_NO_OBJECT[] = "Not an object";
  const char E_UNKNOWN_ENUM[] = "Unknown enum value";

  template <typename T>
  static T* UnwrapThis(const Arguments& args) {
    return ObjectWrap::Unwrap<T>(args.This());
  }

  template <typename T>
  static T* UnwrapThis(const AccessorInfo& args) {
    return ObjectWrap::Unwrap<T>(args.This());
  }

  Persistent<FunctionTemplate> SchemaTemplate;
  Persistent<FunctionTemplate> ServiceSchemaTemplate;
  Persistent<FunctionTemplate> ServiceTemplate;
  Persistent<FunctionTemplate> MethodTemplate;
  Persistent<FunctionTemplate> TypeTemplate;
  Persistent<FunctionTemplate> ParseTemplate;
  Persistent<FunctionTemplate> SerializeTemplate;

  class Schema : public ObjectWrap {
  public:
    Schema(Handle<Object> self, const DescriptorPool* pool)
        : pool_(pool) {
      factory_.SetDelegateToGeneratedFactory(true);
      self->SetInternalField(1, Array::New());
      Wrap(self);
    }

    virtual ~Schema() {
      if (pool_ != DescriptorPool::generated_pool())
        delete pool_;
    }

    class Type : public ObjectWrap {
    public:
      Schema* schema_;
      const Descriptor* descriptor_;

      Message* NewMessage() const {
        return schema_->NewMessage(descriptor_);
      }

      Handle<Function> Constructor() const {
        return handle_->GetInternalField(2).As<Function>();
      }

      Local<Object> NewObject(Handle<Value> properties) const {
        return Constructor()->NewInstance(1, &properties);
      }

      Type(Schema* schema, const Descriptor* descriptor, Handle<Object> self)
        : schema_(schema), descriptor_(descriptor) {
        // Generate functions for bulk conversion between a JS object
        // and an array in descriptor order:
        //   from = function(arr) { this.f0 = arr[0]; this.f1 = arr[1]; ... }
        //   to   = function()    { return [ this.f0, this.f1, ... ] }
        // This is faster than repeatedly calling Get/Set on a v8::Object.
        std::ostringstream from, to;
        from << "(function(arr) { if(arr) {";
        to << "(function() { return [ ";

        for (int i = 0; i < descriptor->field_count(); i++) {
          from <<
            "var x = arr[" << i << "]; "
            "if(x !== undefined) this['" <<
            descriptor->field(i)->camelcase_name() <<
            "'] = x; ";

          if (i > 0) to << ", ";
          to << "this['" << descriptor->field(i)->camelcase_name() << "']";
        }

        from << " }})";
        to << " ]; })";

        // managed type->schema link
        self->SetInternalField(1, schema_->handle_);

        Handle<Function> constructor =
          Script::Compile(String::New(from.str().c_str()))->Run().As<Function>();
        constructor->SetHiddenValue(String::New("type"), self);

        Handle<Function> bind =
          Script::Compile(String::New(
              "(function(self) {"
              "  var f = this;"
              "  return function(arg) {"
              "    return f.call(self, arg);"
              "  };"
              "})"))->Run().As<Function>();
        Handle<Value> arg = self;
        constructor->Set(String::New("parse"), bind->Call(ParseTemplate->GetFunction(), 1, &arg));
        constructor->Set(String::New("serialize"), bind->Call(SerializeTemplate->GetFunction(), 1, &arg));
        self->SetInternalField(2, constructor);
        self->SetInternalField(3, Script::Compile(String::New(to.str().c_str()))->Run());

        Wrap(self);
      }

#define GET(TYPE)                                                        \
      (index >= 0 ?                                                      \
       reflection->GetRepeated##TYPE(instance, field, index) :           \
       reflection->Get##TYPE(instance, field))

      static Handle<Value> ToJs(const Message& instance,
                                const Reflection* reflection,
                                const FieldDescriptor* field,
                                const Type* message_type,
                                int index) {
        switch (field->cpp_type()) {
        case FieldDescriptor::CPPTYPE_MESSAGE:
          return message_type->ToJs(GET(Message));
        case FieldDescriptor::CPPTYPE_STRING: {
          const string& value = GET(String);
          if (field->type() == FieldDescriptor::TYPE_BYTES) {
            return Buffer::New(const_cast<char *>(value.data()),
                               value.length())->handle_;
          } else {
            return String::New(value.data(), value.length());
          }
        }
        case FieldDescriptor::CPPTYPE_INT32:
          return Integer::New(GET(Int32));
        case FieldDescriptor::CPPTYPE_UINT32:
          return Integer::NewFromUnsigned(GET(UInt32));
        case FieldDescriptor::CPPTYPE_INT64: {
          std::ostringstream ss;
          ss << GET(Int64);
          string s = ss.str();
          return String::New(s.data(), s.length());
        }
        case FieldDescriptor::CPPTYPE_UINT64: {
          std::ostringstream ss;
          ss << GET(UInt64);
          string s = ss.str();
          return String::New(s.data(), s.length());
        }
        case FieldDescriptor::CPPTYPE_FLOAT:
          return Number::New(GET(Float));
        case FieldDescriptor::CPPTYPE_DOUBLE:
          return Number::New(GET(Double));
        case FieldDescriptor::CPPTYPE_BOOL:
          return Boolean::New(GET(Bool));
        case FieldDescriptor::CPPTYPE_ENUM:
          return String::New(GET(Enum)->name().c_str());
        }

        return Handle<Value>();  // NOTREACHED
      }
#undef GET

      Handle<Object> ToJs(const Message& instance) const {
        const Reflection* reflection = instance.GetReflection();
        const Descriptor* descriptor = instance.GetDescriptor();

        Handle<Array> properties = Array::New(descriptor->field_count());
        for (int i = 0; i < descriptor->field_count(); i++) {
          HandleScope scope;

          const FieldDescriptor* field = descriptor->field(i);
          bool repeated = field->is_repeated();
          if (repeated && !reflection->FieldSize(instance, field)) continue;
          if (!repeated && !reflection->HasField(instance, field)) continue;

          const Type* child_type =
            (field->cpp_type() == FieldDescriptor::CPPTYPE_MESSAGE) ?
            schema_->GetType(field->message_type()) : NULL;

          Handle<Value> value;
          if (field->is_repeated()) {
            int size = reflection->FieldSize(instance, field);
            Handle<Array> array = Array::New(size);
            for (int j = 0; j < size; j++) {
              array->Set(j, ToJs(instance, reflection, field, child_type, j));
            }
            value = array;
          } else {
            value = ToJs(instance, reflection, field, child_type, -1);
          }

          properties->Set(i, value);
        }

        return NewObject(properties);
      }

      static Handle<Value> Parse(const Arguments& args) {
        Type* type = UnwrapThis<Type>(args);
        if (!Buffer::HasInstance(args[0])) {
          return ThrowException(Exception::TypeError(
             String::New("Argument should be a buffer")));
        }
        Local<Object> buffer_obj = args[0]->ToObject();

        Message* message = type->NewMessage();
        bool success =
          message->ParseFromArray(Buffer::Data(buffer_obj), Buffer::Length(buffer_obj));
        Handle<Value> result = success
          ? Handle<Value>(type->ToJs(*message))
                : v8::ThrowException(
              v8::Exception::Error(String::New("Malformed message")));

        delete message;
        return result;
      }

#define SET(TYPE, EXPR)                                                 \
      if (repeated) reflection->Add##TYPE(instance, field, EXPR);       \
      else reflection->Set##TYPE(instance, field, EXPR)

      static const char* ToProto(Message* instance,
                                 const FieldDescriptor* field,
                                 Handle<Value> value,
                                 const Type* type,
                                 bool repeated) {
        HandleScope scope;

        const Reflection* reflection = instance->GetReflection();
        switch (field->cpp_type()) {
        case FieldDescriptor::CPPTYPE_MESSAGE:
          if (!value->IsObject()) {
            return E_NO_OBJECT;
          }
          type->ToProto(repeated ?
                        reflection->AddMessage(instance, field) :
                        reflection->MutableMessage(instance, field),
                        value.As<Object>());
          break;
        case FieldDescriptor::CPPTYPE_STRING: {
          // Shortcutting Utf8value(buffer.toString())
          if (Buffer::HasInstance(value)) {
            Local<Object> buf = value->ToObject();
            SET(String, string(Buffer::Data(buf), Buffer::Length(buf)));
          } else {
            String::Utf8Value utf8(value);
            SET(String, string(*utf8, utf8.length()));
          }
          break;
        }
        case FieldDescriptor::CPPTYPE_INT32:
          SET(Int32, value->Int32Value());
          break;
        case FieldDescriptor::CPPTYPE_UINT32:
          SET(UInt32, value->Uint32Value());
          break;
        case FieldDescriptor::CPPTYPE_INT64:
          if (value->IsString()) {
            google::protobuf::int64 ll;
            std::istringstream(*String::Utf8Value(value)) >> ll;
            SET(Int64, ll);
          } else {
            SET(Int64, value->NumberValue());
          }
          break;
        case FieldDescriptor::CPPTYPE_UINT64:
          if (value->IsString()) {
            google::protobuf::uint64 ull;
            std::istringstream(*String::Utf8Value(value)) >> ull;
            SET(UInt64, ull);
          } else {
            SET(UInt64, value->NumberValue());
          }
          break;
        case FieldDescriptor::CPPTYPE_FLOAT:
          SET(Float, value->NumberValue());
          break;
        case FieldDescriptor::CPPTYPE_DOUBLE:
          SET(Double, value->NumberValue());
          break;
        case FieldDescriptor::CPPTYPE_BOOL:
          SET(Bool, value->BooleanValue());
          break;
        case FieldDescriptor::CPPTYPE_ENUM:
          const google::protobuf::EnumValueDescriptor* enum_value =
            value->IsNumber() ?
            field->enum_type()->FindValueByNumber(value->Int32Value()) :
            field->enum_type()->FindValueByName(*String::AsciiValue(value));
          if (!enum_value) {
            return E_UNKNOWN_ENUM;
          }
          SET(Enum, enum_value);
          break;
        }

        return NULL;
      }
#undef SET

      const char* ToProto(Message* instance, Handle<Object> src) const {
        Handle<Function> to_array = handle_->GetInternalField(3).As<Function>();
        Handle<Array> properties = to_array->Call(src, 0, NULL).As<Array>();

        const char* error = NULL;
        for (int i = 0; !error && i < descriptor_->field_count(); i++) {
          Handle<Value> value = properties->Get(i);
          if (value->IsUndefined() ||
              value->IsNull()) continue;

          const FieldDescriptor* field = descriptor_->field(i);
          const Type* child_type =
            (field->cpp_type() == FieldDescriptor::CPPTYPE_MESSAGE) ?
            schema_->GetType(field->message_type()) : NULL;
          if (field->is_repeated()) {
            if(!value->IsArray()) {
              error = E_NO_ARRAY;
              continue;
            } 

            Handle<Array> array = value.As<Array>();
            int length = array->Length();

            for (int j = 0; !error && j < length; j++) {
              error = ToProto(instance, field, array->Get(j), child_type, true);
            }
          } else {
            error = ToProto(instance, field, value, child_type, false);
          }
        }
        return error;
      }

      static Handle<Value> Serialize(const Arguments& args) {
        if (!args[0]->IsObject()) {
          return v8::ThrowException(
              v8::Exception::TypeError(v8::String::New("Not an object")));
        }

        Type* type = UnwrapThis<Type>(args);
        Message* message = type->NewMessage();
        const char* error = type->ToProto(message, args[0].As<Object>());
        Buffer* result;
        if (!error) {
          result = Buffer::New(message->ByteSize());
          message->SerializeWithCachedSizesToArray(
              (google::protobuf::uint8*)Buffer::Data(result->handle_));
        }
        delete message;

        return error
          ? v8::ThrowException(v8::Exception::Error(String::New(error)))
          : result->handle_;
      }

      static Handle<Value> ToString(const Arguments& args) {
        return String::New(UnwrapThis<Type>(args)->descriptor_->full_name().c_str());
      }
    };

    Message* NewMessage(const Descriptor* descriptor) {
      return factory_.GetPrototype(descriptor)->New();
    }

    Type* GetType(const Descriptor* descriptor) {
      Type* result = types_[descriptor];
      if (result) return result;

      result = types_[descriptor] =
        new Type(this, descriptor, TypeTemplate->GetFunction()->NewInstance());

      // managed schema->[type] link
      Handle<Array> types = handle_->GetInternalField(1).As<Array>();
      types->Set(types->Length(), result->handle_);
      return result;
    }

    const DescriptorPool* pool_;
    map<const Descriptor*, Type*> types_;
    DynamicMessageFactory factory_;

    static Handle<Value> GetType(const Local<String> name,
                                 const AccessorInfo& args) {
      Schema* schema = UnwrapThis<Schema>(args);
      const Descriptor* descriptor =
        schema->pool_->FindMessageTypeByName(*String::AsciiValue(name));

      return descriptor ?
        schema->GetType(descriptor)->Constructor() :
        Handle<Function>();
    }

    static Handle<Value> NewSchema(const Arguments& args) {
      if (!args.Length()) {
        return (new Schema(args.This(),
                           DescriptorPool::generated_pool()))->handle_;
      }

      if (!Buffer::HasInstance(args[0])) {
        return ThrowException(Exception::TypeError(
           String::New("Argument should be a buffer")));
      }
      Local<Object> buffer_obj = args[0]->ToObject();
      char *buffer_data = Buffer::Data(buffer_obj);
      size_t buffer_length = Buffer::Length(buffer_obj);

      FileDescriptorSet descriptors;
      if (!descriptors.ParseFromArray(buffer_data, buffer_length)) {
        return v8::ThrowException(
            v8::Exception::Error(String::New("Malformed descriptor")));
      }

      DescriptorPool* pool = new DescriptorPool;
      for (int i = 0; i < descriptors.file_size(); i++) {
        pool->BuildFile(descriptors.file(i));
      }

      return (new Schema(args.This(), pool))->handle_;
    }
  };

 // services

/*
  class WrappedService : public ObjectWrap {
  public:
    static Handle<Value> Invoke(const Arguments& args) {
      WrappedService* self = UnwrapThis<WrappedService>(args);

      MethodDescriptor* method = static_cast<MethodDescriptor*>(External::Unwrap(args[0]));
      Schema* schema = ObjectWrap::Unwrap<Schema>(self->handle_->GetInternalField(1).As<Object>());
      Schema::Type* input_type = schema->GetType(method->input_type());
      Schema::Type* output_type = schema->GetType(method->output_type());
      Message* request = self->service_->GetRequestPrototype(method).New();
      Message* response = self->service_->GetResponsePrototype(method).New();
      input_type->ToProto(request, args[1].As<Object>());

      if (args.Length() > 2) {
        AsyncInvocation::Start(self, method, request, response, output_type, args[2].As<Function>());
        return v8::Undefined();
      } else {
        bool done = false;
        self->service_->CallMethod(method,
                                   NULL,
                                   request,
                                   response,
                                   google::protobuf::NewCallback(&WrappedService::Done, &done));
        if (!done)
          fprintf(stderr, "ERROR: Synchronous proto service invocation %s didn't invoke 'done->Run()'\n", method->full_name().c_str());

        Handle<Object> result = output_type->ToJs(*response);

        delete response;
        delete request;

        return result;
      }
    }

    WrappedService(Service* service) : service_(service) {
      Wrap(ServiceTemplate->GetFunction()->NewInstance());

      const ServiceDescriptor* descriptor = service->GetDescriptor();
      Schema* schema = new Schema(ServiceSchemaTemplate->GetFunction()->NewInstance(),
                                  descriptor->file()->pool());
      handle_->SetInternalField(1, schema->handle_);

      Handle<Function> bind =
        Script::Compile(String::New(
            "(function(m) {"
            "  var f = this;"
            "  return function(arg1, arg2) {"
            "    return arg2 ? f.call(this, m, arg1, arg2) : f.call(this, m, arg1);"
            "  };"
            "})"))->Run().As<Function>();
      for (int i = 0; i < descriptor->method_count(); i++) {
        const MethodDescriptor* method = descriptor->method(i);
        Handle<Value> arg = External::Wrap(const_cast<MethodDescriptor*>(method));
        handle_->Set(String::New(method->name().c_str()),
                     bind->Call(MethodTemplate->GetFunction(), 1, &arg));
      }
    }

    virtual ~WrappedService() {
      delete service_;
    }

    static void Init() {
      AsyncInvocation::Init();
    }

  private:
    Service* service_;

    static void Done(bool* done) {
      *done = true;
    }

    class AsyncInvocation {
    public:
      static void Init() {
        uv_async_init(uv_default_loop(), &ev_done, &InvokeAsyncCallbacks);
      }

      // main thread:
      static void Start(WrappedService* service,
                        MethodDescriptor* method,
                        Message* request,
                        Message* response,
                        Schema::Type* response_type,
                        Handle<Function> cb) {

        uv_work_t *req = new uv_work_t;

        uv_queue_work(uv_default_loop(), req, &AsyncInvocation::Run, &AsyncInvocation::Returned);
        ev_ref(EV_DEFAULT_UC);
      }

    private:
      AsyncInvocation(WrappedService* service,
                      MethodDescriptor* method,
                      Message* request,
                      Message* response,
                      Schema::Type* response_type,
                      Handle<Function> cb) : service_(service),
                                               method_(method),
                                               request_(request),
                                               response_(response),
                                               response_type_(response_type),
                                               cb_(Persistent<Function>::New(cb)),
                                               done_(false) {
        service_->Ref();  // includes ->schema->type
      }

      ~AsyncInvocation() {
        service_->Unref();
        cb_.Dispose();
        delete request_;
        delete response_;
      }

      static AsyncInvocation* head;
      static uv_async_t ev_done;

      // in some thread:
      static void Run(uv_work_t *req) {
        AsyncInvocation* self = static_cast<AsyncInvocation*>(req->data);
        self->service_->service_->CallMethod(self->method_,
                                             NULL,
                                             self->request_,
                                             self->response_,
                                             google::protobuf::NewCallback(&Done, self));
      }

      // in some thread:
      static void Done(AsyncInvocation* self) {
        self->done_ = true;
        uv_async_send(&ev_done);
      }

      // main thread: service method returned
      static void Returned(uv_work_t* req) {
        AsyncInvocation* self = static_cast<AsyncInvocation*>(req->data);
        if (self->done_) {
          InvokeCallback(self);
        } else {
          // first delayed response?

          // enqueue
          self->next_ = head;
          head = self;
        }
      }

      // main thread: service called Done() delayed
      static void InvokeAsyncCallbacks(uv_async_t *a, int b) {
        AsyncInvocation** pself = &head;
        AsyncInvocation* self;
        while ((self = *pself)) {
          if (self->done_) {
            *pself = self->next_;
            InvokeCallback(self);
          } else {
            pself = &(self->next_);
          }
        }

        // all outstanding callbacks delivered
        if (!head) {
          uv_close((uv_handle_t*) &ev_done, NULL);
	}
      }

      static void InvokeCallback(AsyncInvocation* self) {
        HandleScope scope;
        Handle<Value> result = self->response_type_->ToJs(*(self->response_));
        self->cb_->Call(Context::GetCurrent()->Global(), 1, &result);
        delete self;
        ev_unref(EV_DEFAULT_UC);
      }

    private:
      WrappedService* service_;
      MethodDescriptor* method_;
      Message* request_;
      Message* response_;
      Schema::Type* response_type_;
      Persistent<Function> cb_;
      bool done_;
      AsyncInvocation* next_;
    };
  };
  WrappedService::AsyncInvocation* WrappedService::AsyncInvocation::head = NULL;
  uv_async_t WrappedService::AsyncInvocation::ev_done;
*/

  static void Init() {
    if (!TypeTemplate.IsEmpty()) return;

    TypeTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New());
    TypeTemplate->SetClassName(String::New("Type"));
    // native self
    // owning schema (so GC can manage our lifecyle)
    // constructor
    // toArray
    TypeTemplate->InstanceTemplate()->SetInternalFieldCount(4);

    SchemaTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Schema::NewSchema));
    SchemaTemplate->SetClassName(String::New("Schema"));
    // native self
    // array of types (so GC can manage our lifecyle)
    SchemaTemplate->InstanceTemplate()->SetInternalFieldCount(2);
    SchemaTemplate->InstanceTemplate()->SetNamedPropertyHandler(Schema::GetType);

    ServiceSchemaTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New());
    ServiceSchemaTemplate->SetClassName(String::New("Schema"));
    // native self
    // array of types (so GC can manage our lifecyle)
    ServiceSchemaTemplate->InstanceTemplate()->SetInternalFieldCount(2);
    ServiceSchemaTemplate->InstanceTemplate()->SetNamedPropertyHandler(Schema::GetType);

    ServiceTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New());
    ServiceTemplate->SetClassName(String::New("Service"));
    ServiceTemplate->InstanceTemplate()->SetInternalFieldCount(2);

    //MethodTemplate  = Persistent<FunctionTemplate>::New(FunctionTemplate::New(WrappedService::Invoke));

    ParseTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Schema::Type::Parse));
    SerializeTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Schema::Type::Serialize));

    //WrappedService::Init();
  }

  Local<Function> SchemaConstructor() {
    Init();
    return SchemaTemplate->GetFunction();
  }

  void ExportService(Handle<Object> target, const char* name, Service* service) {
    Init();
    //target->Set(String::New(name), (new WrappedService(service))->handle_);
  }

}  // namespace protobuf_for_node
