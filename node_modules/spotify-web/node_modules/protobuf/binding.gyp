{
	"targets": [
		{
			"target_name": "protobuf_for_node",
			"include_dirs": ["protobuf/src"],
			"dependencies": ["protobuf/protobuf.gyp:protobuf_full_do_not_use"],
			"sources": [
				"protobuf_for_node.cc", "addon.cc"
			]
		}
	]
}
