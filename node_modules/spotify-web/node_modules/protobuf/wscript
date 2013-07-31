# Copyright 2010 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you
# may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
# implied. See the License for the specific language governing
# permissions and limitations under the License.

import os
import Options

srcdir = '.'
blddir = 'build'
VERSION = '0.3.0'

def set_options(opt):
  opt.tool_options('compiler_cxx')

def configure(conf):
  conf.check_tool('compiler_cxx')
  conf.check_tool('node_addon')

  conf.env.append_value('CCFLAGS', ['-O3'])
  conf.env.append_value('CXXFLAGS', ['-O3'])
  if Options.platform == 'darwin': conf.env.append_value('LINKFLAGS', ['-undefined', 'dynamic_lookup'])
  conf.env.append_value("CPPPATH_PROTOBUF", "%s/include"%(os.environ['PROTOBUF']))
  conf.env.append_value("LIBPATH_PROTOBUF", "%s/lib"%(os.environ['PROTOBUF']))
  conf.env.append_value("LIB_PROTOBUF", "protobuf")

def build(bld):
  # protobuf_for_node comes as a library to link against for services
  # and an addon to use for plain serialization.
  #obj = bld.new_task_gen('cxx', 'shlib')
  #obj.target = 'protobuf_for_node_lib'
  #obj.source = 'protobuf_for_node.cc'
  #obj.uselib = ['NODE', 'PROTOBUF']

  obj = bld.new_task_gen('cxx', 'shlib', 'node_addon')
  obj.target = 'protobuf_for_node'
  obj.source = 'protobuf_for_node.cc addon.cc'
  obj.uselib = ['PROTOBUF', 'NODE']
  #obj.uselib_local = 'protobuf_for_node_lib'

  # Example service. If you build your own add-on that exports a
  # protobuf service, you will need to replace uselib_local with
  # uselib and point CPPPATH, LIBPATH and LIB to where you've
  # installed protobuf_for_node.
  #obj = bld.new_task_gen('cxx', 'shlib', 'node_addon')
  #obj.target = 'protoservice'
  #obj.source = ['example/protoservice.pb.cc', 'example/protoservice.cc']
  #obj.uselib = ['PROTOBUF']
  #obj.uselib_local = 'protobuf_for_node_lib'
