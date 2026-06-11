export function friendlyJobError(raw: string): string {
  if (/429|rate.?limit|too.?many.?request/i.test(raw))
    return "The AI service is temporarily overloaded. Please retry in a few minutes.";
  if (/private|age.?restrict/i.test(raw))
    return "This video is private or age-restricted — transcripts can't be fetched.";
  if (/transcript too short|too short/i.test(raw))
    return "Video is too short or has very little speech. Try a longer video with captions enabled.";
  if (/Supadata.*404|video.*not found/i.test(raw))
    return "Video not found. Double-check the YouTube URL and try again.";
  if (/Supadata/i.test(raw))
    return "Couldn't fetch the video transcript. The video may be private, deleted, or have no captions.";
  if (/caption|subtitle/i.test(raw))
    return "No captions found. Try a video with auto-generated captions or upload the audio directly.";
  if (/whisper|transcri/i.test(raw))
    return "Audio transcription failed. Try a shorter clip or a different format (MP3, WAV, M4A).";
  if (/timeout|ECONNRESET|ENOTFOUND|network|connect/i.test(raw))
    return "Network error during processing. Please retry the job.";
  if (/API_KEY|api.?key/i.test(raw))
    return "Service configuration error. Please contact support.";
  if (/context.?length|token|too long/i.test(raw))
    return "The video transcript is too long to process. Try a shorter video (under 30 minutes).";
  return "Processing failed unexpectedly. Please try again — it often works on a second attempt.";
}
