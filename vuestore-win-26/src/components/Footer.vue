<template>
  <footer class="bg-gray-900">
    <!-- Trust Badges Section -->
    <div class="hidden sm:block bg-primary-600">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- 12-column grid for perfect alignment -->
        <div class="grid grid-cols-2 lg:grid-cols-12 gap-8">
          <!-- Badge 1 - spans 3 cols, left aligns with 关于我们 -->
          <div class="lg:col-span-3 flex items-center justify-center lg:justify-start text-white">
            <svg class="w-8 h-8 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span class="text-sm font-medium">实体药房，正品保障</span>
          </div>
          <!-- Badge 2 - spans 3 cols -->
          <div class="lg:col-span-3 flex items-center justify-center lg:justify-start text-white">
            <svg class="w-8 h-8 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium">境外直邮，全球速递</span>
          </div>
          <!-- Badge 3 - spans 3 cols -->
          <div class="lg:col-span-3 flex items-center justify-center lg:justify-start text-white">
            <svg class="w-8 h-8 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span class="text-sm font-medium">中文客服，购药无忧</span>
          </div>
          <!-- Badge 4 - spans 3 cols, right aligns with 服务热线 -->
          <div class="lg:col-span-3 flex items-center justify-center lg:justify-start text-white">
            <svg class="w-8 h-8 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span class="text-sm font-medium">保护隐私，安全放心</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Footer Content -->
    <div class="max-w-7xl mx-auto pl-8 pr-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8">
        <!-- 关于我们 - spans 2 cols -->
        <div class="lg:col-span-2">
          <h3 class="text-white text-lg font-semibold mb-4">关于我们</h3>
          <ul class="space-y-2">
            <li>
              <a href="/about/company" class="text-gray-400 hover:text-white text-sm transition-colors">
                公司资质
              </a>
            </li>
            <li>
              <a href="/about/contact" class="text-gray-400 hover:text-white text-sm transition-colors">
                联系我们
              </a>
            </li>
            <li>
              <a href="/about/pharmacy" class="text-gray-400 hover:text-white text-sm transition-colors">
                药房介绍
              </a>
            </li>
          </ul>
        </div>

        <!-- 购买指南 - spans 2 cols -->
        <div class="lg:col-span-2">
          <h3 class="text-white text-lg font-semibold mb-4">购买指南</h3>
          <ul class="space-y-2">
            <li>
              <a href="/guide/faq" class="text-gray-400 hover:text-white text-sm transition-colors">
                常见问题
              </a>
            </li>
            <li>
              <a href="/guide/payment" class="text-gray-400 hover:text-white text-sm transition-colors">
                支付方式
              </a>
            </li>
            <li>
              <a href="/guide/process" class="text-gray-400 hover:text-white text-sm transition-colors">
                购买流程
              </a>
            </li>
            <li>
              <a href="/guide/authenticity" class="text-gray-400 hover:text-white text-sm transition-colors">
                辨别真伪
              </a>
            </li>
          </ul>
        </div>

        <!-- 售后服务 - spans 2 cols -->
        <div class="lg:col-span-2">
          <h3 class="text-white text-lg font-semibold mb-4">售后服务</h3>
          <ul class="space-y-2">
            <li>
              <a href="/service/returns" class="text-gray-400 hover:text-white text-sm transition-colors">
                退换货物
              </a>
            </li>
            <li>
              <a href="/service/receipt" class="text-gray-400 hover:text-white text-sm transition-colors">
                票据收据
              </a>
            </li>
            <li>
              <a href="/service/customs" class="text-gray-400 hover:text-white text-sm transition-colors">
                清关协助
              </a>
            </li>
          </ul>
        </div>

        <!-- 物流配送 - spans 2 cols -->
        <div class="lg:col-span-2">
          <h3 class="text-white text-lg font-semibold mb-4">物流配送</h3>
          <ul class="space-y-2">
            <li>
              <a href="/shipping/methods" class="text-gray-400 hover:text-white text-sm transition-colors">
                邮寄方式
              </a>
            </li>
            <li>
              <a href="/shipping/privacy" class="text-gray-400 hover:text-white text-sm transition-colors">
                隐私配送
              </a>
            </li>
            <li>
              <a href="/shipping/tracking" class="text-gray-400 hover:text-white text-sm transition-colors">
                物流查询
              </a>
            </li>
            <li>
              <a href="/shipping/fees" class="text-gray-400 hover:text-white text-sm transition-colors">
                运费标准
              </a>
            </li>
          </ul>
        </div>

        <!-- 服务政策 - spans 2 cols -->
        <div class="lg:col-span-2">
          <h3 class="text-white text-lg font-semibold mb-4">服务政策</h3>
          <ul class="space-y-2">
            <li>
              <a href="/policy/privacy" class="text-gray-400 hover:text-white text-sm transition-colors">
                隐私保护
              </a>
            </li>
            <li>
              <a href="/policy/legal" class="text-gray-400 hover:text-white text-sm transition-colors">
                法律声明
              </a>
            </li>
            <li>
              <a href="/policy/disclaimer" class="text-gray-400 hover:text-white text-sm transition-colors">
                免责声明
              </a>
            </li>
            <li>
              <a href="/policy/terms" class="text-gray-400 hover:text-white text-sm transition-colors">
                服务条款
              </a>
            </li>
          </ul>
        </div>

        <!-- 服务热线 - spans 2 cols -->
        <div class="lg:col-span-2">
          <h3 class="text-white text-lg font-semibold mb-4">服务热线</h3>
          <p class="text-primary-400 text-sm sm:text-lg font-bold mb-4">{{ telephoneNumber }}</p>
          <!-- <div class="bg-white p-2 rounded-lg inline-block">
            <div class="w-24 h-24 bg-gray-200 flex items-center justify-center">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM8 12v4h2v-4H8zm-4 4h2v-4H4v4zm16-4v4h2v-4h-2zm-8-4v4h2V8h-2zm-4 4v4h2v-4H8z" />
              </svg>
            </div>
          </div> -->
          <div class="">
            <!-- Customer Service QR Code -->
            <div class="text-center">
              <div class="rounded p-3">
                <img :src="customerServiceQRCode" alt="Customer Service QR Code"
                  class="w-36 h-36 mx-auto object-contain" @error="handleQRCodeError" />
              </div>
              <!-- <p class="text-xs text-gray-600 mt-1">{{ t('header.scanToContact') }}</p> -->
              <p class="text-xs text-gray-600 mt-1">{{ weixinAccountNumber }}</p>
              <p class="text-gray-500 text-xs mt-2">扫码关注微信公众号</p>
            </div>

          </div>
          
        </div>
      </div>
    </div>

    <!-- Copyright Section -->
    <div class="border-t border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center">
          <p class="text-gray-500 text-sm mb-2">
            {{ copyrightLine1 }}
          </p>
          <p class="text-gray-600 text-xs">
            {{ copyrightLine2 }}
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>

import { computed } from 'vue'
export default {
  name: 'Footer',

  setup() {

    // Customer service QR code from environment
    const customerServiceQRCode = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_QRCODE || ''
    })

    const weixinAccountNumber = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_WEIXIN || ''
    })

    const telephoneNumber = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_TELEPHONE || ''
    })

    const copyrightLine1 = computed(() => {
      return import.meta.env.VITE_FOOTER_COPYRIGHT_LINE_1 || ''
    })

    const copyrightLine2 = computed(() => {
      return import.meta.env.VITE_FOOTER_COPYRIGHT_LINE_2 || ''
    })

    

    // Handle QR code error
    const handleQRCodeError = (event) => {
      console.warn('Customer service QR code failed to load in header modal')
    }


    return {
      handleQRCodeError,
      customerServiceQRCode,
      weixinAccountNumber,
      telephoneNumber,
      copyrightLine1,
      copyrightLine2
    }
  }


}


</script>
