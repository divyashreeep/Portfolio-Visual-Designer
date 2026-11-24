// All tunable scene constants; homepage composition is unchanged.
export const CONFIG={duration:8,blue:'#0000CC',paper:'#F8F7F3',dpr:1.5,
 camera:{position:[0,0,60],fov:7.2,near:45,far:75},
 hands:{scale:1.9,mobileScale:1,mobileDesignWidth:390},
 colour:{start:6.3,end:7.5},
 labels:{enter:0,tension:1,firstWrap:1.15,throwIndexCapture:2.2,secondWrap:2.4,oppositeIndexCapture:3.2,mountApproach:4,mount:4.65,hold:4.8,release:5.1,swing:6.3,arrival:7.5},
 final:{x:.527,y:.614,diameter:.55,rx:.03,ry:Math.PI+.62,rz:.03}};
export function frameLayout(w,h,mobileOverride){const mobile=mobileOverride??(w<650),d=mobile?w*.56:Math.min(w*.42,h*.70),y=h*(mobile?.37:.40);return{w,h,mobile,d,left:[w*.5-d*.5,y],right:[w*.5+d*.5,y],diameter:Math.min(h*.16,w*(mobile?.17:.13))};}
