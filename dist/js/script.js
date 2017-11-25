!function(a,b){"function"==typeof define&&define.amd?define(b):"object"==typeof exports?module.exports=b():a.tingle=b()}(this,function(){function b(b){this.opts=a({},{onClose:null,onOpen:null,beforeOpen:null,beforeClose:null,stickyFooter:!1,footer:!1,cssClass:[],closeLabel:"Close",closeMethods:["overlay","button","escape"]},b),this.init()}function f(){this.modalBoxFooter&&(this.modalBoxFooter.style.width=this.modalBox.clientWidth+"px",this.modalBoxFooter.style.left=this.modalBox.offsetLeft+"px")}function g(){this.modal=document.createElement("div"),this.modal.classList.add("tingle-modal"),0!==this.opts.closeMethods.length&&-1!==this.opts.closeMethods.indexOf("overlay")||this.modal.classList.add("tingle-modal--noOverlayClose"),this.modal.style.display="none",this.opts.cssClass.forEach(function(a){"string"==typeof a&&this.modal.classList.add(a)},this),-1!==this.opts.closeMethods.indexOf("button")&&(this.modalCloseBtn=document.createElement("button"),this.modalCloseBtn.classList.add("tingle-modal__close"),this.modalCloseBtnIcon=document.createElement("span"),this.modalCloseBtnIcon.classList.add("tingle-modal__closeIcon"),this.modalCloseBtnIcon.innerHTML="\xD7",this.modalCloseBtnLabel=document.createElement("span"),this.modalCloseBtnLabel.classList.add("tingle-modal__closeLabel"),this.modalCloseBtnLabel.innerHTML=this.opts.closeLabel,this.modalCloseBtn.appendChild(this.modalCloseBtnIcon),this.modalCloseBtn.appendChild(this.modalCloseBtnLabel)),this.modalBox=document.createElement("div"),this.modalBox.classList.add("tingle-modal-box"),this.modalBoxContent=document.createElement("div"),this.modalBoxContent.classList.add("tingle-modal-box__content"),this.modalBox.appendChild(this.modalBoxContent),-1!==this.opts.closeMethods.indexOf("button")&&this.modal.appendChild(this.modalCloseBtn),this.modal.appendChild(this.modalBox)}function e(){this.modalBoxFooter=document.createElement("div"),this.modalBoxFooter.classList.add("tingle-modal-box__footer"),this.modalBox.appendChild(this.modalBoxFooter)}function h(){this._events={clickCloseBtn:this.close.bind(this),clickOverlay:j.bind(this),resize:this.checkOverflow.bind(this),keyboardNav:i.bind(this)},-1!==this.opts.closeMethods.indexOf("button")&&this.modalCloseBtn.addEventListener("click",this._events.clickCloseBtn),this.modal.addEventListener("mousedown",this._events.clickOverlay),window.addEventListener("resize",this._events.resize),document.addEventListener("keydown",this._events.keyboardNav)}function i(a){-1!==this.opts.closeMethods.indexOf("escape")&&27===a.which&&this.isOpen()&&this.close()}function j(a){-1!==this.opts.closeMethods.indexOf("overlay")&&!k(a.target,"tingle-modal")&&a.clientX<this.modal.clientWidth&&this.close()}function k(a,b){for(;(a=a.parentElement)&&!a.classList.contains(b););return a}function d(){-1!==this.opts.closeMethods.indexOf("button")&&this.modalCloseBtn.removeEventListener("click",this._events.clickCloseBtn),this.modal.removeEventListener("mousedown",this._events.clickOverlay),window.removeEventListener("resize",this._events.resize),document.removeEventListener("keydown",this._events.keyboardNav)}function a(){for(var a=1;a<arguments.length;a++)for(var b in arguments[a])arguments[a].hasOwnProperty(b)&&(arguments[0][b]=arguments[a][b]);return arguments[0]}var l=function(){var a,b=document.createElement("tingle-test-transition"),c={transition:"transitionend",OTransition:"oTransitionEnd",MozTransition:"transitionend",WebkitTransition:"webkitTransitionEnd"};for(a in c)if(void 0!==b.style[a])return c[a]}();return b.prototype.init=function(){this.modal||(g.call(this),h.call(this),document.body.insertBefore(this.modal,document.body.firstChild),this.opts.footer&&this.addFooter())},b.prototype.destroy=function(){null!==this.modal&&(d.call(this),this.modal.parentNode.removeChild(this.modal),this.modal=null)},b.prototype.open=function(){var a=this;"function"==typeof a.opts.beforeOpen&&a.opts.beforeOpen(),this.modal.style.removeProperty?this.modal.style.removeProperty("display"):this.modal.style.removeAttribute("display"),document.body.classList.add("tingle-enabled"),this.setStickyFooter(this.opts.stickyFooter),this.modal.classList.add("tingle-modal--visible"),l?this.modal.addEventListener(l,function b(){"function"==typeof a.opts.onOpen&&a.opts.onOpen.call(a),a.modal.removeEventListener(l,b,!1)},!1):"function"==typeof a.opts.onOpen&&a.opts.onOpen.call(a),this.checkOverflow()},b.prototype.isOpen=function(){return!!this.modal.classList.contains("tingle-modal--visible")},b.prototype.close=function(){if("function"==typeof this.opts.beforeClose){var a=this.opts.beforeClose.call(this);if(!a)return}document.body.classList.remove("tingle-enabled"),this.modal.classList.remove("tingle-modal--visible");var b=this;l?this.modal.addEventListener(l,function a(){b.modal.removeEventListener(l,a,!1),b.modal.style.display="none","function"==typeof b.opts.onClose&&b.opts.onClose.call(this)},!1):(b.modal.style.display="none","function"==typeof b.opts.onClose&&b.opts.onClose.call(this))},b.prototype.setContent=function(a){"string"==typeof a?this.modalBoxContent.innerHTML=a:(this.modalBoxContent.innerHTML="",this.modalBoxContent.appendChild(a))},b.prototype.getContent=function(){return this.modalBoxContent},b.prototype.addFooter=function(){e.call(this)},b.prototype.setFooterContent=function(a){this.modalBoxFooter.innerHTML=a},b.prototype.getFooterContent=function(){return this.modalBoxFooter},b.prototype.setStickyFooter=function(a){this.isOverflow()||(a=!1),a?this.modalBox.contains(this.modalBoxFooter)&&(this.modalBox.removeChild(this.modalBoxFooter),this.modal.appendChild(this.modalBoxFooter),this.modalBoxFooter.classList.add("tingle-modal-box__footer--sticky"),f.call(this),this.modalBoxContent.style["padding-bottom"]=this.modalBoxFooter.clientHeight+20+"px"):this.modalBoxFooter&&(this.modalBox.contains(this.modalBoxFooter)||(this.modal.removeChild(this.modalBoxFooter),this.modalBox.appendChild(this.modalBoxFooter),this.modalBoxFooter.style.width="auto",this.modalBoxFooter.style.left="",this.modalBoxContent.style["padding-bottom"]="",this.modalBoxFooter.classList.remove("tingle-modal-box__footer--sticky")))},b.prototype.addFooterBtn=function(a,b,c){var d=document.createElement("button");return d.innerHTML=a,d.addEventListener("click",c),"string"==typeof b&&b.length&&b.split(" ").forEach(function(a){d.classList.add(a)}),this.modalBoxFooter.appendChild(d),d},b.prototype.resize=function(){},b.prototype.isOverflow=function(){var a=window.innerHeight,b=this.modalBox.clientHeight;return b>=a},b.prototype.checkOverflow=function(){this.modal.classList.contains("tingle-modal--visible")&&(this.isOverflow()?this.modal.classList.add("tingle-modal--overflow"):this.modal.classList.remove("tingle-modal--overflow"),!this.isOverflow()&&this.opts.stickyFooter?this.setStickyFooter(!1):this.isOverflow()&&this.opts.stickyFooter&&(f.call(this),this.setStickyFooter(!0)))},{modal:b}}),!function(a,b){"function"==typeof define&&define.amd?define([],b()):"object"==typeof module&&module.exports?module.exports=b():function c(){document&&document.body?a.zenscroll=b():setTimeout(c,9)}()}(this,function(){"use strict";var b=Math.min,d=Math.max,g=function(a){return"getComputedStyle"in window&&"smooth"===window.getComputedStyle(a)["scroll-behavior"]};if("undefined"==typeof window||!("document"in window))return{};var a=function(h,j,k){j=j||999,k||0===k||(k=9);var e,m=function(a){e=a},p=function(){clearTimeout(e),m(0)},q=function(a){return d(0,h.getTopOf(a)-k)},c=function(e,k,i){if(p(),0===k||k&&0>k||g(h.body))h.toY(e),i&&i();else{var c=h.getY(),f=d(0,e)-c,a=new Date().getTime();k=k||b(Math.abs(f),j),function e(){m(setTimeout(function(){var g=b(1,(new Date().getTime()-a)/k),j=d(0,Math.floor(c+f*(.5>g?2*g*g:g*(4-2*g)-1)));h.toY(j),1>g&&h.getHeight()+j<h.body.scrollHeight?e():(setTimeout(p,99),i&&i())},9))}()}},v=function(a,b,d){c(q(a),b,d)};return{setup:function(a,b){return(0===a||a)&&(j=a),(0===b||b)&&(k=b),{defaultDuration:j,edgeOffset:k}},to:v,toY:c,intoView:function(a,b,d){var e=a.getBoundingClientRect().height,f=h.getTopOf(a)+e,g=h.getHeight(),i=h.getY();q(a)<i||e+k>g?v(a,b,d):f+k>i+g?c(f-g+k,b,d):d&&d()},center:function(a,b,e,f){c(d(0,h.getTopOf(a)-h.getHeight()/2+(e||a.getBoundingClientRect().height/2)),b,f)},stop:p,moving:function(){return!!e},getY:h.getY,getTopOf:h.getTopOf}},c=document.documentElement,e=function(){return window.scrollY||c.scrollTop},h=a({body:document.scrollingElement||document.body,toY:function(a){window.scrollTo(0,a)},getY:e,getHeight:function(){return window.innerHeight||c.clientHeight},getTopOf:function(a){return a.getBoundingClientRect().top+e()-c.offsetTop}});if(h.createScroller=function(d,e,f){return a({body:d,toY:function(a){d.scrollTop=a},getY:function(){return d.scrollTop},getHeight:function(){return b(d.clientHeight,window.innerHeight||c.clientHeight)},getTopOf:function(a){return a.offsetTop}},e,f)},"addEventListener"in window&&!window.noZensmooth&&!g(document.body)){var i="scrollRestoration"in history;i&&(history.scrollRestoration="auto"),window.addEventListener("load",function(){i&&(setTimeout(function(){history.scrollRestoration="manual"},9),window.addEventListener("popstate",function(a){a.state&&"zenscrollY"in a.state&&h.toY(a.state.zenscrollY)},!1)),window.location.hash&&setTimeout(function(){var a=h.setup().edgeOffset;if(a){var b=document.getElementById(window.location.href.split("#")[1]);if(b){var c=d(0,h.getTopOf(b)-a),e=h.getY()-c;0<=e&&9>e&&window.scrollTo(0,c)}}},9)},!1);var j=/(^|\s)noZensmooth(\s|$)/;window.addEventListener("click",function(b){for(var g=b.target;g&&"A"!==g.tagName;)g=g.parentNode;if(!(!g||1!==b.which||b.shiftKey||b.metaKey||b.ctrlKey||b.altKey)){if(i)try{history.replaceState({zenscrollY:h.getY()},"")}catch(a){}var k=g.getAttribute("href")||"";if(0===k.indexOf("#")&&!j.test(g.className)){var l=0,m=document.getElementById(k.substring(1));if("#"!==k){if(!m)return;l=h.getTopOf(m)}b.preventDefault();var n=function(){window.location=k},f=h.setup().edgeOffset;f&&(l=d(0,l-f),n=function(){history.pushState(null,"",k)}),h.toY(l,null,n)}}},!1)}return h});var modal=new tingle.modal({footer:!0,stickyFooter:!1,closeMethods:["overlay","button","escape"],closeLabel:"Close",cssClass:["custom-class-1","custom-class-2"],onOpen:function(){},onClose:function(){document.getElementById("error").className="pure-u-1"},beforeClose:function(){return!0}});document.addEventListener("DOMContentLoaded",function(){document.getElementById("globeVideo").play()}),modal.addFooterBtn("Button label","",function(){modal.close()}),modal.addFooterBtn("Dangerous action !","",function(){modal.close()}),modal.setContent(document.getElementById("modal-main").innerHTML),modal.setFooterContent(document.getElementById("modal-footer").innerHTML);function openModal(){modal.open()}function signIn(){document.getElementById("error").className="pure-u-1 active"}function contact(){modal.close();let a=document.getElementById("email-input");a.focus()}