import React, { useEffect, useState } from "react";
import { Book, RefreshCw, Share2, Heart, Calendar } from "lucide-react";

// This is the enhanced Daily Hadith section to replace your current implementation
const HadithSection = () => {
  const [hadith, setHadith] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchHadith();
  }, []);

  const fetchHadith = async () => {
    try {
      setLoading(true);
      const edition = "eng-bukhari";
      const totalHadith = 7000;
      const today = new Date();
      
      const dayOfYear = Math.floor(
        (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
      );
      const hadithNumber = (dayOfYear % totalHadith) + 1;
      
      let url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}/${hadithNumber}.min.json`;
      let res = await fetch(url);
      
      if (!res.ok) {
        url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}/${hadithNumber}.json`;
        res = await fetch(url);
      }
      
      const data = await res.json();
      
      if (data?.hadiths?.length > 0) {
        setHadith(data.hadiths[0].text);
        setMeta({
          book: data.metadata?.name,
          number: data.hadiths[0].hadithnumber,
        });
      } else {
        setHadith("No hadith found today.");
      }
    } catch (err) {
      console.error("Error fetching hadith:", err);
      setHadith("Error fetching hadith. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleShare = async () => {
    if (navigator.share && hadith) {
      try {
        await navigator.share({
          title: 'Daily Hadith',
          text: `"${hadith}" - ${meta?.book}, Hadith ${meta?.number}`,
        });
      } catch (err) {
        console.log(err);
        
        // Fallback to clipboard
        navigator.clipboard.writeText(`"${hadith}" - ${meta?.book}, Hadith ${meta?.number}`);
      }
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-y-auto">
      {/* Header Section */}
      <div className="p-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="bg-white/20 p-2  rounded-full">
              <Book className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold">Daily Hadith</h1>
          </div>
        </div>
      </div>
            {/* Prayer Reminder */}
          <div className="p-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-200 rounded-full p-2">
                  <Calendar className="w-4 h-4 text-yellow-700" />
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">Daily Reminder</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    "And whoever relies upon Allah - then He is sufficient for him. 
                    Indeed, Allah will accomplish His purpose." - Quran 65:3
                  </p>
                </div>
              </div>
            </div>
          </div>
      {/* Main Content */}
      <div className="p-6">
  
        {loading ? (
          <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-8">
            <div className="text-center">
              <div className="inline-block w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4"></div>
              <p className="text-green-600 font-medium">Loading today's wisdom...</p>
              <p className="text-green-500 text-sm mt-1">Fetching hadith from collection</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Hadith Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden">
              {/* Decorative top border */}
              <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
              
              <div className="p-8">
                {hadith ? (
                  <div className="space-y-6">
                    {/* Opening Quote */}
                    <div className="text-center">
                      <span className="text-6xl text-green-200 font-serif leading-none select-none">"</span>
                    </div>
                    
                    {/* Hadith Text */}
                    <div className="relative">
                      <p className="text-gray-800 text-lg leading-relaxed font-medium text-center italic px-2">
                        {hadith}
                      </p>
                    </div>

                    {/* Closing Quote */}
                    <div className="text-center">
                      <span className="text-6xl text-green-200 font-serif leading-none select-none">"</span>
                    </div>
                    
                    {/* Source Information */}
                    {meta && (
                      <div className="text-center pt-6 border-t border-green-100">
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-100">
                          <Book className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-green-700 text-sm font-medium">
                            {meta.book}, Hadith {meta.number}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Islamic Blessing */}
                    <div className="text-center pt-4 space-y-2">
                      <p className="text-green-600/60 text-base font-arabic">
                        صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ
                      </p>
                      <p className="text-green-600/50 text-sm">
                        Peace and blessings be upon him
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4 pt-6">
                      <button
                        onClick={() => setLiked(!liked)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                          liked 
                            ? 'bg-red-100 text-red-600 border border-red-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">
                          {liked ? 'Liked' : 'Like'}
                        </span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors border border-blue-200"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Share</span>
                      </button>

                      <button
                        onClick={fetchHadith}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors border border-green-200"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm font-medium">Refresh</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Book className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-gray-600 font-medium">Unable to load hadith</p>
                    <p className="text-gray-500 text-sm mt-1">Please try again later</p>
                    <button
                      onClick={fetchHadith}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6 border border-green-200">
              <div className="text-center">
                <h3 className="font-semibold text-green-800 mb-2">Daily Spiritual Guidance</h3>
                <p className="text-green-700 text-sm leading-relaxed">
                  Each day brings a new hadith from the authentic collection of Sahih Bukhari. 
                  Let these timeless teachings of Prophet Muhammad (PBUH) guide and inspire your daily life.
                </p>
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
};

export default HadithSection;