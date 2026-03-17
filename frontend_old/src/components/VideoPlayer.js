import React, { useEffect, useRef } from 'react';

/**
 * VideoPlayer - Renders a single video stream tile
 * Handles both local and remote streams, shows avatar if no video
 */
const VideoPlayer = ({
  stream,
  userName = 'User',
  userRole = 'student',
  isLocal = false,
  isAudioEnabled = true,
  isVideoEnabled = true,
  isScreenSharing = false,
  isSpeaking = false,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = (userName || 'U')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && isVideoEnabled;

  const tileClass = [
    'video-tile',
    isLocal ? 'is-local' : '',
    isSpeaking ? 'is-speaking' : '',
    isScreenSharing ? 'screen-share' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={tileClass}>
      {/* Video or placeholder */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} /* Mute local to avoid echo */
          className={isLocal && !isScreenSharing ? 'mirrored' : ''}
          style={{ display: hasVideo ? 'block' : 'none' }}
        />
      )}

      {!hasVideo && (
        <div className="video-placeholder">
          <div className="avatar">{initials}</div>
        </div>
      )}

      {/* Screen share indicator */}
      {isScreenSharing && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: 'rgba(255, 179, 71, 0.9)',
            color: '#000',
            borderRadius: 'var(--radius-full)',
            padding: '0.2rem 0.6rem',
            fontSize: '0.7rem',
            fontWeight: '700',
          }}
        >
          📺 Screen
        </div>
      )}

      {/* Info overlay */}
      <div className="video-tile-info">
        <div className="video-tile-name">
          {isLocal ? '👤 ' : ''}{userName}
          {isLocal && (
            <span className="role-tag" style={{ background: 'rgba(108, 99, 255, 0.8)' }}>
              You
            </span>
          )}
          {!isLocal && userRole === 'teacher' && (
            <span className="role-tag teacher">Teacher</span>
          )}
        </div>

        <div className="video-tile-icons">
          <div className={`media-icon ${isAudioEnabled ? 'active' : 'muted'}`}>
            {isAudioEnabled ? '🎤' : '🔇'}
          </div>
          <div className={`media-icon ${isVideoEnabled ? 'active' : 'muted'}`}>
            {isVideoEnabled ? '📷' : '📵'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
