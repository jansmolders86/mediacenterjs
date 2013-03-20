/* pipe raw PCM audio data here, it will be output to
 * the default audio output device.
 */

#include "mpg123app.h"
#include <string.h>
#include <stdio.h>

extern mpg123_module_t mpg123_output_module_info;

int main () {
  int r;
  char buffer[4096];

  fprintf(stderr, "api_version: %d\n", mpg123_output_module_info.api_version);
  fprintf(stderr, "name: %s\n", mpg123_output_module_info.name);
  fprintf(stderr, "description: %s\n", mpg123_output_module_info.description);
  fprintf(stderr, "revision: %s\n", mpg123_output_module_info.revision);
  fprintf(stderr, "\n\n");

  audio_output_t ao;
  memset(&ao, 0, sizeof(audio_output_t)); /* nullify all fields */
  ao.channels = 2; /* channels */
  ao.rate = 44100; /* rample rate */
  ao.format = MPG123_ENC_SIGNED_16; /* bit depth, is signed?, int/float */

  /* init_output() */
  r = mpg123_output_module_info.init_output(&ao);
  if (r) {
    fprintf(stderr, "init_output() failed: %d\n", r);
    return r;
  }
  fprintf(stderr, "ao.get_formats(): %d\n", ao.get_formats(&ao));

  /* open() */
  r = ao.open(&ao);
  if (r) {
    fprintf(stderr, "ao.open() failed: %d\n", r);
    return r;
  }

  while (1) {
    size_t b = fread(buffer, sizeof(char), sizeof(buffer) / sizeof(char), stdin);
    if (b == 0) {
      fprintf(stderr, "got EOF\n");
      break;
    }
    fprintf(stderr, "read %zu bytes\n", b);

    /* write */
    r = ao.write(&ao, buffer, b);
    if (r != b) {
      fprintf(stderr, "ao.write() failed: %d\n", r);
      return r;
    }
  }

  /* flush() */
  ao.flush(&ao);

  /* close() */
  r = ao.close(&ao);
  if (r) {
    fprintf(stderr, "ao.close() failed: %d\n", r);
    return r;
  }

  /* deinit() */
  r = ao.deinit(&ao);
  if (r) {
    fprintf(stderr, "ao.deinit() failed: %d\n", r);
    return r;
  }

  fprintf(stderr, "Done!\n");
  return 0;
}
