<template>
  <div class="demo">
    <div class="preview">
      <video ref="video" :width="width"></video>
      <div class="shooted-preview" v-if="nowPreview">
        <img class="shooted-preview-photo" :src="'data:image/png;base64,' + nowPreview" />
      </div>
      <div class="shooted-list" :style="nowPreview ? `top: -${height}px` : 'top: -60px'" v-if="shootedList.length > 0">
        <div style="display: inline-block" v-for="(photo, index) in shootedList" v-bind:key="photo">
          <div class="shooted-del">
            <i @click="deletePhoto(index)" class="el-icon-error"></i>
          </div>
          <img @click="preview(photo)" class="photo" :src="'data:image/png;base64,' + photo" />
        </div>
      </div>
    </div>
    <div class="toolbar" v-if="canUse">
      <el-radio-group :style="nowPreview ? 'visibility:hidden;' : ''" v-model="mode" size="small" text-color="#fff"
        fill="#A0A0A0">
        <el-radio-button value="fourPhoto"><i class="el-icon-menu"></i></el-radio-button>
          <el-radio-button value="portrait"><i class="el-icon-s-custom"></i></el-radio-button>
          <el-radio-button value="video"><i class="el-icon-video-camera"></i></el-radio-button>
      </el-radio-group>
      <div class="tool-action">
        <el-avatar :class="nowPreview ? 'back-shoot' : 'shoot-btn'" @click="shoot">
          <i class="iconfont icon-camera_fill shoot-icon"></i>
        </el-avatar>
      </div>
      <el-button size="small" v-if="!nowPreview">效果</el-button>
                    <el-button size="small" @click="download()" v-else>分享</el-button>
      <canvas ref="canvas" style="display: none" :width="width" :height="height"></canvas>
    </div>
    <div class="title" v-else>浏览器不支持</div>
  </div>
</template>

<style scoped>
  .demo {
    display: flex;
    height: 100%;
    width: 100%;
    margin-top: 0;
    color: #333;
    text-shadow: none;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  .preview {
    height: 405px;
    width: 540px;
  }

  .shooted-preview {
    width: 540px;
    height: 345px;
    position: relative;
    bottom: 405px;
    background-color: #000;
    background-repeat: no-repeat;
    z-index: 1;
  }

  .shooted-preview-photo {
    width: 540px;
    height: 405px;
  }

  .shooted-del {
    position: relative;
    top: 0;
    left: 0;
    width: 3px;
    height: 3px;
    z-index: 3;
  }

  .toolbar {
    display: flex;
    width: 540px;
    height: 50px;
    justify-content: space-between;
    align-items: center;
    margin: 10px;
  }

  .shooted-list {
    width: 535px;
    height: 60px;
    position: relative;
    bottom: 60px;
    background-color: #f4e5ecf7;
    overflow-x: scroll;
    overflow-y: hidden;
    white-space: nowrap;
    text-align: right;
    z-index: 2;
  }

  .shoot-btn {
    background-color: red;
  }

  .back-shoot {
    background-color: gray;
  }

  .tool-action {
    width: 130px;
  }

  .shoot-icon {
    color: white;
    font-size: 24px;
  }

  .photo {
    width: 50px;
    height: 50px;
    background-color: #000;
    background-repeat: no-repeat;
    margin: 5px;
  }

  .title {
    font-size: 24px;
    text-align: left;
    margin: 10%;
  }
</style>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'demo_camera',
  title: 'Photo Booth',
  icon: 'icon-camera1',
  iconColor: '#fff',
  iconBgColor: '#E24637',
  width: 540,
  height: 540,
  resizable: false,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  category: 'graphics',
  description: '相机拍照应用演示',
  version: '1.0.0',
  author: 'Demo Team',
  demo: true,
  featured: false
}
</script>

<script setup lang="ts">
  import { ref } from 'vue'

  // 响应式数据
  const canUse = ref(false)
  const width = ref(540)
  const height = ref(405)
  const mode = ref('portrait')
  const nowPreview = ref('')
  const shootedList = ref([])

  // 模板引用
  const video = ref(null)
  const canvas = ref(null)

  // 方法
  const getCamera = () => {
    //这段代 主要是获取摄像头的视频流并显示在Video 签中
    const videoEl = video.value
    function successCallback(stream) {
      // Set the source of the video element with the stream from the camera
      if (videoEl.mozSrcObject !== undefined) {
        videoEl.mozSrcObject = stream
      } else {
        videoEl.srcObject = stream
      }
      videoEl.play()
    }

    function errorCallback(error) {
      alert('错误代码: [CODE ' + error.code + ']')
      // Display a friendly "sorry" message to the user
    }
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    window.URL =
      window.URL || window.webkitURL || window.mozURL || window.msURL

    // Call the getUserMedia method with our callback functions
    if (navigator.getUserMedia) {
      canUse.value = true
      navigator.getUserMedia({ video: true }, successCallback, errorCallback)
    } else {
      alert('浏览器不支持getUserMedia方法调用摄像头', navigator.getUserMedia)
      // Display a friendly "sorry" message to the user
    }
  }

  const shoot = () => {
    if (nowPreview.value) {
      nowPreview.value = ''
      return
    }
    const content = canvas.value.getContext('2d')
    const videoEl = video.value
    content.drawImage(videoEl, 0, 0, 540, 405)
    //获取浏览器页面的画布对象
    const canvasEl = canvas.value
    //以下开始编码数据
    const imgData = canvasEl.toDataURL()
    //将图像转换为base64数据
    const base64Data = imgData.substr(22)
    //将获得的base64数据加入shootedList数组
    shootedList.value.push(base64Data)
  }

  const preview = (photo) => {
    nowPreview.value = photo
  }

  const deletePhoto = (index) => {
    const shootedListValue = shootedList.value
    shootedListValue.splice(index, 1)
    shootedList.value = shootedListValue
    if (nowPreview.value && shootedListValue.length == 0) {
      shoot()
    }
  }

  const base64Img2Blob = (code) => {
    const parts = code.split(';base64,')
    const contentType = parts[0].split(':')[1]
    const raw = window.atob(parts[1])
    const rawLength = raw.length

    const uInt8Array = new Uint8Array(rawLength)

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }

    return new Blob([uInt8Array], { type: contentType })
  }

  const download = () => {
    const canvasID = canvas.value
    const downloadEl = document.createElement('a')
    const blob = base64Img2Blob(canvasID.toDataURL('image/png'))
    downloadEl.setAttribute('href', URL.createObjectURL(blob))
    downloadEl.setAttribute('download', new Date().getTime() + '.png')
    document.body.appendChild(downloadEl)
    downloadEl.click()
    URL.revokeObjectURL(blob)
    document.body.removeChild(downloadEl)
  }

  // 生命周期钩子
  onMounted(() => {
    try {
      getCamera()
    } catch (e) {
      console.log(e)
    }
  })

  onBeforeUnmount(() => {
    try {
      const videoEl = video.value
      const stream = videoEl.srcObject
      const tracks = stream.getTracks()
      tracks.forEach(function (track) {
        track.stop()
      })
      videoEl.srcObject = null
    } catch ($e) {
      console.log('关闭摄像头异常', $e)
    }
  })
</script>
