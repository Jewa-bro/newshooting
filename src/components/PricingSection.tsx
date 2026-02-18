import React from 'react';
import { Clock, CalendarDays, BadgeCheck } from 'lucide-react';

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-blue-900">가격 안내</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          사격 체험 및 1:1 강습 프로그램 가격을 안내드립니다
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 사격 체험 */}
          <div className="bg-gray-50 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-blue-900 text-white p-4">
              <div className="flex items-center mb-1">
                <Clock className="h-5 w-5 mr-2" />
                <h3 className="text-lg font-bold">사격 체험</h3>
              </div>
              <p className="text-blue-100 text-sm">레이저 / 실탄 사격 체험 프로그램</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-900">레이저 사격 30분</span>
                  <span className="text-base font-bold text-gray-900 tabular-nums">7,000원</span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-900">레이저 사격 60분</span>
                  <span className="text-base font-bold text-gray-900 tabular-nums">10,000원</span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-900">레이저 사격 60분 + 실탄 10발</span>
                  <span className="text-base font-bold text-gray-900 tabular-nums">15,000원</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 1:1 강습 */}
          <div className="bg-gray-50 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-red-600 text-white p-4">
              <div className="flex items-center mb-1">
                <CalendarDays className="h-5 w-5 mr-2" />
                <h3 className="text-lg font-bold">1:1 강습</h3>
              </div>
              <p className="text-red-100 text-sm">1개월 1:1 레이저 90분 강습</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">평일</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                      <span className="font-semibold text-gray-900">주 1회 (총 4회)</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">120,000원</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                      <span className="font-semibold text-gray-900">주 2회 (총 8회)</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">220,000원</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                      <span className="font-semibold text-gray-900">주 3회 (총 12회)</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">300,000원</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">주말</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                      <span className="font-semibold text-gray-900">주 1회 (총 4회)</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">140,000원</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                      <span className="font-semibold text-gray-900">주 2회 (총 8회)</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">260,000원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <div className="inline-flex items-center bg-blue-50 text-blue-900 rounded-2xl px-5 py-3">
            <BadgeCheck className="h-5 w-5 mr-2 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold">전문 선수반 육성 (상담 후 결정)</div>
              <div className="text-sm text-blue-800/80">목표에 맞춘 훈련 계획과 코칭을 상담 후 안내드립니다</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;