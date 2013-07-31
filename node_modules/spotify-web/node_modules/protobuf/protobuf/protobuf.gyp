# Copyright (c) 2012 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

{
  'conditions': [
    ['OS!="win"', {
      'variables': {
        'config_h_dir':
          '.',  # crafted for gcc/linux.
      },
    }, {  # else, OS=="win"
      'variables': {
        'config_h_dir':
          'vsprojects',  # crafted for msvc.
      },
      'target_defaults': {
        'msvs_disabled_warnings': [
          4018,  # signed/unsigned mismatch in comparison
          4244,  # implicit conversion, possible loss of data
          4355,  # 'this' used in base member initializer list
        ],
        'defines!': [
          'WIN32_LEAN_AND_MEAN',  # Protobuf defines this itself.
        ],
      },
    }]
  ],
  'targets': [
    # The "lite" lib is about 1/7th the size of the heavy lib,
    # but it doesn't support some of the more exotic features of
    # protobufs, like reflection.  To generate C++ code that can link
    # against the lite version of the library, add the option line:
    #
    #   option optimize_for = LITE_RUNTIME;
    #
    # to your .proto file.
    {
      'target_name': 'protobuf_lite',
      'type': 'static_library',
      'toolsets': ['host', 'target'],
      'sources': [
        'src/google/protobuf/stubs/atomicops.h',
        'src/google/protobuf/stubs/atomicops_internals_arm_gcc.h',
        'src/google/protobuf/stubs/atomicops_internals_atomicword_compat.h',
        'src/google/protobuf/stubs/atomicops_internals_macosx.h',
        'src/google/protobuf/stubs/atomicops_internals_mips_gcc.h',
        # not needed for this version 2.4.1 of protobuf
        #'src/google/protobuf/stubs/atomicops_internals_x86_gcc.cc',
        #'src/google/protobuf/stubs/atomicops_internals_x86_gcc.h',
        #'src/google/protobuf/stubs/atomicops_internals_x86_msvc.cc',
        #'src/google/protobuf/stubs/atomicops_internals_x86_msvc.h',
        'src/google/protobuf/stubs/common.h',
        'src/google/protobuf/stubs/once.h',
        'src/google/protobuf/stubs/platform_macros.h',
        'src/google/protobuf/extension_set.h',
        'src/google/protobuf/generated_message_util.h',
        'src/google/protobuf/message_lite.h',
        'src/google/protobuf/repeated_field.h',
        'src/google/protobuf/unknown_field_set.cc',
        'src/google/protobuf/unknown_field_set.h',
        'src/google/protobuf/wire_format_lite.h',
        'src/google/protobuf/wire_format_lite_inl.h',
        'src/google/protobuf/io/coded_stream.h',
        'src/google/protobuf/io/zero_copy_stream.h',
        'src/google/protobuf/io/zero_copy_stream_impl_lite.h',

        'src/google/protobuf/stubs/common.cc',
        'src/google/protobuf/stubs/once.cc',
        'src/google/protobuf/stubs/hash.h',
        'src/google/protobuf/stubs/map-util.h',
        'src/google/protobuf/stubs/stl_util-inl.h',
        'src/google/protobuf/extension_set.cc',
        'src/google/protobuf/generated_message_util.cc',
        'src/google/protobuf/message_lite.cc',
        'src/google/protobuf/repeated_field.cc',
        'src/google/protobuf/wire_format_lite.cc',
        'src/google/protobuf/io/coded_stream.cc',
        'src/google/protobuf/io/coded_stream_inl.h',
        'src/google/protobuf/io/zero_copy_stream.cc',
        'src/google/protobuf/io/zero_copy_stream_impl_lite.cc',
        '<(config_h_dir)/config.h',
      ],
      'include_dirs': [
        '<(config_h_dir)',
        'src',
      ],
      # This macro must be defined to suppress the use of dynamic_cast<>,
      # which requires RTTI.
      'defines': [
        'GOOGLE_PROTOBUF_NO_RTTI',
        'GOOGLE_PROTOBUF_NO_STATIC_INITIALIZER',
      ],

      'direct_dependent_settings': {
        'include_dirs': [
          '<(config_h_dir)',
          'src',
        ],
        'defines': [
          'GOOGLE_PROTOBUF_NO_RTTI',
          'GOOGLE_PROTOBUF_NO_STATIC_INITIALIZER',
        ],
      },
    },
    # This is the full, heavy protobuf lib that's needed for c++ .proto's
    # that don't specify the LITE_RUNTIME option.  The protocol
    # compiler itself (protoc) falls into that category.
    #
    # DO NOT LINK AGAINST THIS TARGET IN CHROME CODE  --agl
    {
      'target_name': 'protobuf_full_do_not_use',
      'type': 'static_library',
      'toolsets': ['host','target'],
      'sources': [
        'src/google/protobuf/descriptor.h',
        'src/google/protobuf/descriptor.pb.h',
        'src/google/protobuf/descriptor_database.h',
        'src/google/protobuf/dynamic_message.h',
        'src/google/protobuf/generated_message_reflection.h',
        'src/google/protobuf/message.h',
        'src/google/protobuf/reflection_ops.h',
        'src/google/protobuf/service.h',
        'src/google/protobuf/text_format.h',
        'src/google/protobuf/wire_format.h',
        'src/google/protobuf/io/gzip_stream.h',
        'src/google/protobuf/io/printer.h',
        'src/google/protobuf/io/tokenizer.h',
        'src/google/protobuf/io/zero_copy_stream_impl.h',
#        'src/google/protobuf/compiler/code_generator.h',
#        'src/google/protobuf/compiler/command_line_interface.h',
#        'src/google/protobuf/compiler/importer.h',
#        'src/google/protobuf/compiler/parser.h',

        'src/google/protobuf/stubs/strutil.cc',
        'src/google/protobuf/stubs/strutil.h',
        'src/google/protobuf/stubs/substitute.cc',
        'src/google/protobuf/stubs/substitute.h',
        'src/google/protobuf/stubs/structurally_valid.cc',
        'src/google/protobuf/descriptor.cc',
        'src/google/protobuf/descriptor.pb.cc',
        'src/google/protobuf/descriptor_database.cc',
        'src/google/protobuf/dynamic_message.cc',
        'src/google/protobuf/extension_set_heavy.cc',
        'src/google/protobuf/generated_message_reflection.cc',
        'src/google/protobuf/message.cc',
        'src/google/protobuf/reflection_ops.cc',
        'src/google/protobuf/service.cc',
        'src/google/protobuf/text_format.cc',
        'src/google/protobuf/wire_format.cc',
        # This file pulls in zlib, but it's not actually used by protoc, so
        # instead of compiling zlib for the host, let's just exclude this.
        # 'src/src/google/protobuf/io/gzip_stream.cc',
        'src/google/protobuf/io/printer.cc',
        'src/google/protobuf/io/tokenizer.cc',
        'src/google/protobuf/io/zero_copy_stream_impl.cc',
#        'src/google/protobuf/compiler/importer.cc',
#        'src/google/protobuf/compiler/parser.cc',
      ],
      'dependencies': [
        'protobuf_lite',
      ],
      'export_dependent_settings': [
        'protobuf_lite',
      ],
    },
    {
      'target_name': 'protoc',
      'conditions': [
        ['OS!="ios"', {
          'type': 'executable',
          'toolsets': ['host'],
          'sources': [
            'src/google/protobuf/compiler/code_generator.cc',
            'src/google/protobuf/compiler/command_line_interface.cc',
            'src/google/protobuf/compiler/plugin.cc',
            'src/google/protobuf/compiler/plugin.pb.cc',
            'src/google/protobuf/compiler/subprocess.cc',
            'src/google/protobuf/compiler/subprocess.h',
            'src/google/protobuf/compiler/zip_writer.cc',
            'src/google/protobuf/compiler/zip_writer.h',
            'src/google/protobuf/compiler/cpp/cpp_enum.cc',
            'src/google/protobuf/compiler/cpp/cpp_enum.h',
            'src/google/protobuf/compiler/cpp/cpp_enum_field.cc',
            'src/google/protobuf/compiler/cpp/cpp_enum_field.h',
            'src/google/protobuf/compiler/cpp/cpp_extension.cc',
            'src/google/protobuf/compiler/cpp/cpp_extension.h',
            'src/google/protobuf/compiler/cpp/cpp_field.cc',
            'src/google/protobuf/compiler/cpp/cpp_field.h',
            'src/google/protobuf/compiler/cpp/cpp_file.cc',
            'src/google/protobuf/compiler/cpp/cpp_file.h',
            'src/google/protobuf/compiler/cpp/cpp_generator.cc',
            'src/google/protobuf/compiler/cpp/cpp_helpers.cc',
            'src/google/protobuf/compiler/cpp/cpp_helpers.h',
            'src/google/protobuf/compiler/cpp/cpp_message.cc',
            'src/google/protobuf/compiler/cpp/cpp_message.h',
            'src/google/protobuf/compiler/cpp/cpp_message_field.cc',
            'src/google/protobuf/compiler/cpp/cpp_message_field.h',
            'src/google/protobuf/compiler/cpp/cpp_primitive_field.cc',
            'src/google/protobuf/compiler/cpp/cpp_primitive_field.h',
            'src/google/protobuf/compiler/cpp/cpp_service.cc',
            'src/google/protobuf/compiler/cpp/cpp_service.h',
            'src/google/protobuf/compiler/cpp/cpp_string_field.cc',
            'src/google/protobuf/compiler/cpp/cpp_string_field.h',
            'src/google/protobuf/compiler/java/java_enum.cc',
            'src/google/protobuf/compiler/java/java_enum.h',
            'src/google/protobuf/compiler/java/java_enum_field.cc',
            'src/google/protobuf/compiler/java/java_enum_field.h',
            'src/google/protobuf/compiler/java/java_extension.cc',
            'src/google/protobuf/compiler/java/java_extension.h',
            'src/google/protobuf/compiler/java/java_field.cc',
            'src/google/protobuf/compiler/java/java_field.h',
            'src/google/protobuf/compiler/java/java_file.cc',
            'src/google/protobuf/compiler/java/java_file.h',
            'src/google/protobuf/compiler/java/java_generator.cc',
            'src/google/protobuf/compiler/java/java_helpers.cc',
            'src/google/protobuf/compiler/java/java_helpers.h',
            'src/google/protobuf/compiler/java/java_message.cc',
            'src/google/protobuf/compiler/java/java_message.h',
            'src/google/protobuf/compiler/java/java_message_field.cc',
            'src/google/protobuf/compiler/java/java_message_field.h',
            'src/google/protobuf/compiler/java/java_primitive_field.cc',
            'src/google/protobuf/compiler/java/java_primitive_field.h',
            'src/google/protobuf/compiler/java/java_service.cc',
            'src/google/protobuf/compiler/java/java_service.h',
            'src/google/protobuf/compiler/java/java_string_field.cc',
            'src/google/protobuf/compiler/java/java_string_field.h',
            'src/google/protobuf/compiler/python/python_generator.cc',
            'src/google/protobuf/compiler/main.cc',
          ],
          'dependencies': [
            'protobuf_full_do_not_use',
          ],
          'include_dirs': [
            '<(config_h_dir)',
            'src/src',
          ],
#        }, {  # else, OS=="ios"
#          'type': 'none',
#          'variables': {
#            'ninja_output_dir': 'ninja-protoc',
#            # Gyp to rerun
#            're_run_targets': [
#              'third_party/protobuf/protobuf.gyp',
#            ],
#          },
#          'includes': ['../../build/ios/mac_build.gypi'],
#          'actions': [
#            {
#              'action_name': 'compile protoc',
#              'inputs': [],
#              'outputs': [],
#              'action': [
#                '<@(ninja_cmd)',
#                'protoc',
#              ],
#              'message': 'Generating the C++ protocol buffers compiler',
#            },
#            {
#              'action_name': 'copy protoc',
#              'inputs': [
#                '<(ninja_product_dir)/protoc',
#              ],
#              'outputs': [
#                '<(PRODUCT_DIR)/protoc',
#              ],
#              'action': [
#                'cp',
#                '<(ninja_product_dir)/protoc',
#                '<(PRODUCT_DIR)/protoc',
#              ],
#            },
#          ],
        }],
      ],
    },
    {
      # Generate the python module needed by all protoc-generated Python code.
      'target_name': 'py_proto',
      'type': 'none',
      'copies': [
        {
          'destination': '<(PRODUCT_DIR)/pyproto/google/',
          'files': [
            # google/ module gets an empty __init__.py.
            '__init__.py',
          ],
        },
        {
          'destination': '<(PRODUCT_DIR)/pyproto/google/protobuf',
          'files': [
            'python/google/protobuf/__init__.py',
            'python/google/protobuf/descriptor.py',
            'python/google/protobuf/message.py',
            'python/google/protobuf/reflection.py',
            'python/google/protobuf/service.py',
            'python/google/protobuf/service_reflection.py',
            'python/google/protobuf/text_format.py',

            # TODO(ncarter): protoc's python generator treats descriptor.proto
            # specially, but it's not possible to trigger the special treatment
            # unless you run protoc from ./src/src (the treatment is based
            # on the path to the .proto file matching a constant exactly).
            # I'm not sure how to convince gyp to execute a rule from a
            # different directory.  Until this is resolved, use a copy of
            # descriptor_pb2.py that I manually generated.
            'descriptor_pb2.py',
          ],
        },
        {
          'destination': '<(PRODUCT_DIR)/pyproto/google/protobuf/internal',
          'files': [
            'python/google/protobuf/internal/__init__.py',
            'python/google/protobuf/internal/api_implementation.py',
            'python/google/protobuf/internal/containers.py',
            'python/google/protobuf/internal/cpp_message.py',
            'python/google/protobuf/internal/decoder.py',
            'python/google/protobuf/internal/encoder.py',
            'python/google/protobuf/internal/generator_test.py',
            'python/google/protobuf/internal/message_listener.py',
            'python/google/protobuf/internal/python_message.py',
            'python/google/protobuf/internal/type_checkers.py',
            'python/google/protobuf/internal/wire_format.py',
          ],
        },
      ],
  #   # We can't generate a proper descriptor_pb2.py -- see earlier comment.
  #   'rules': [
  #     {
  #       'rule_name': 'genproto',
  #       'extension': 'proto',
  #       'inputs': [
  #         '<(PRODUCT_DIR)/<(EXECUTABLE_PREFIX)protoc<(EXECUTABLE_SUFFIX)',
  #       ],
  #       'variables': {
  #         # The protoc compiler requires a proto_path argument with the
  #           # directory containing the .proto file.
  #           'rule_input_relpath': 'src/google/protobuf',
  #         },
  #         'outputs': [
  #           '<(PRODUCT_DIR)/pyproto/google/protobuf/<(RULE_INPUT_ROOT)_pb2.py',
  #         ],
  #         'action': [
  #           '<(PRODUCT_DIR)/<(EXECUTABLE_PREFIX)protoc<(EXECUTABLE_SUFFIX)',
  #           '-I./src',
  #           '-I.',
  #           '--python_out=<(PRODUCT_DIR)/pyproto/google/protobuf',
  #           'google/protobuf/descriptor.proto',
  #         ],
  #         'message': 'Generating Python code from <(RULE_INPUT_PATH)',
  #       },
  #     ],
  #     'dependencies': [
  #       'protoc#host',
  #     ],
  #     'sources': [
  #       'src/google/protobuf/descriptor.proto',
  #     ],
     },
  ],
}
