#include <v8.h>
#include <node.h>
#include "lame.h"

namespace nodelame {

/* enums used to set the type of the input PCM */
typedef enum {
  PCM_TYPE_SHORT_INT,
  PCM_TYPE_FLOAT,
  PCM_TYPE_DOUBLE
} pcm_type;

/* struct that's used for async encoding */
struct encode_req {
  uv_work_t req;
  lame_global_flags *gfp;
  unsigned char *input;
  int input_type;
  int num_samples;
  unsigned char *output;
  int output_size;
  int rtn;
  v8::Persistent<v8::Function> callback;
};

void node_lame_encode_buffer_interleaved_async (uv_work_t *);
void node_lame_encode_buffer_interleaved_after (uv_work_t *);

void node_lame_encode_flush_nogap_async (uv_work_t *);
#define node_lame_encode_flush_nogap_after node_lame_encode_buffer_interleaved_after

} // nodelame namespace
