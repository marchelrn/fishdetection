# Fish Detection AI - Enhanced for Vercel

🐟 **Advanced AI-powered fish species detection platform optimized for production deployment.**

## 🚀 **Quick Deploy to Vercel**

### **Option 1: GitHub Integration (Recommended)**

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy automatically with every push

### **Option 2: Direct Upload**

1. Zip your project files
2. Upload to Vercel dashboard
3. Deploy instantly

## 🔧 **Features**

- ✅ **Real-time fish detection** via camera
- ✅ **Image upload analysis** with drag & drop
- ✅ **5 fish species detection**: Selar Bentong, Tuna, Tongkol, Layang Benggol, Kembung
- ✅ **Production-ready** with enhanced error handling
- ✅ **Mobile responsive** design
- ✅ **HTTPS support** for camera access
- ✅ **Vercel optimized** deployment

## 🛠️ **Tech Stack**

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI/ML**: Roboflow API for object detection
- **Deployment**: Vercel (Static Site)
- **Camera**: MediaDevices API
- **Graphics**: Canvas API for overlay rendering

## 📁 **Project Structure**

```
fish-detection-ai/
├── index.html          # Main HTML file
├── script.js           # Camera detection logic
├── camera.js           # Image upload functionality
├── vercel.json         # Vercel configuration
├── package.json        # Project metadata
└── README.md           # This file
```

## 🔑 **Environment Configuration**

The app automatically detects the environment:

- **Development**: `localhost` or `127.0.0.1`
- **Production**: `vercel.app` domains or HTTPS sites

## 🐛 **Debugging**

### **Browser Console Logs**

- 🚀 Initialization messages
- 📹 Camera status updates
- 🌐 API request/response logs
- 🚨 Error messages with stack traces

### **Common Issues & Solutions**

1. **Camera not working**:

   - Ensure HTTPS is enabled (Vercel provides this)
   - Check camera permissions in browser
   - Try refreshing the page

2. **API calls failing**:

   - Check browser console for network errors
   - Verify internet connection
   - Check Roboflow API status

3. **Upload not working**:
   - Ensure file is a valid image (JPG, PNG, WebP)
   - Check file size (max 10MB)
   - Verify drag & drop or click upload

## 🌐 **API Integration**

Uses Roboflow API for fish detection:

- **Endpoint**: `https://detect.roboflow.com`
- **Project**: `dataset-6nff1`
- **Version**: `4`
- **Format**: JSON for camera, Image for uploads

## 📱 **Browser Compatibility**

- ✅ **Chrome** 88+ (recommended)
- ✅ **Firefox** 85+
- ✅ **Safari** 14+
- ✅ **Edge** 88+
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🚦 **Performance**

- **Load time**: < 2 seconds
- **Detection latency**: < 3 seconds
- **API response**: < 1 second
- **Mobile optimized**: Responsive design

## 📞 **Support**

If you encounter issues:

1. Check browser console for error messages
2. Ensure HTTPS and camera permissions
3. Verify internet connection
4. Try different browsers/devices

---

**Made with ❤️ for fish detection and marine research**
