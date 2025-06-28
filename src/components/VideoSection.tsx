import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <section id="video" className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-blue-900">
            클럽 소개 영상
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            대전HB슈팅클럽의 분위기와 시설을<br />
            영상으로 만나보세요
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              className="w-full h-auto"
              controls
              preload="metadata"
              poster={`${import.meta.env.BASE_URL}images/slide_image_1.jpg`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              <source 
                src={`${import.meta.env.BASE_URL}videos/hbshooting_video.mp4`} 
                type="video/mp4" 
              />
              <p className="text-white p-4">
                죄송합니다. 브라우저에서 동영상을 지원하지 않습니다.
              </p>
            </video>
            
            {/* 커스텀 플레이 버튼 오버레이 */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
                onClick={handlePlayPause}
              >
                <div className="bg-black/70 rounded-full p-4 transition-all duration-300 hover:bg-black/90 hover:scale-110">
                  <Play className="h-12 w-12 text-white ml-1" />
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default VideoSection; 