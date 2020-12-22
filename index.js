let IS_MIRROR = true;
let DISPLAY_SIZE = 640;
const MODEL_PATH = './tf_model_t082_unfixed/model.json';

let BIG_SIZE = 1920;

let START_PHOTO_AT_SUCCESS_FRAME_NO = 2;

let height = 0;
let width = 0;

let PASSPORT_TRAIN_SIZE_PX_X = 256;
let PASSPORT_TRAIN_SIZE_PX_Y = 364;
let PASSPORT_ASPECT_RATIO = PASSPORT_TRAIN_SIZE_PX_X / PASSPORT_TRAIN_SIZE_PX_Y
let PAD_SIZE = 96;
let NET_SCALE = 32; 
let PASSPORT_N_POINTS = 6;
let THRESHOLD = 77; // 0.3 *255

let N_FRAMES_FPS_COUNT = 5

let UP_PAGE_POINTS_INDEXES = [0, 1, 2, 5]; 
let DOWN_PAGE_POINTS_INDEXES = [5, 2, 3, 4];
let PAGE_N_POINTS = 4;
let NOT_DETECTED = 0;
let DETECTED = 1;
let RECOVERED = 2;
let PAGE_ASPECT_RATIO = 1.42;  // = 125 / 88
let ZONE_SIZE_RELATIVE = 0.15;

let N_CC_STATS_MEASURES = 5;

let FILTER_WINDOW_WIDTH_FAST = 0.8;
let FILTER_WINDOW_WIDTH_SLOW = 5;
let SLOW_MOTION_DIST_THRESHOLD_RELATIVE_PER_SEC = 0.3;
let slow_motion_dist_threshold_per_sec = 0;

let canvasOutput = document.getElementById("canvasOutput")
let resolution = {width: {ideal: BIG_SIZE}, height: {ideal: BIG_SIZE}};
let video = document.getElementById("video");
const cv = window.cv;
let streaming = false;
let stream = null;
let videoCapture = null;
let frame = null;
let frame_rgb = null;
let frame_aspect_ratio = 0;
let resize_factor = 0;
let height_inside = 0;
let width_inside = 0;
let net_input_size_x = 0;
let net_input_size_y = 0;
let size_inside = null;
let frame_inside = null;
let frame_net_input = null;
let net_output_size_x = 0;
let net_output_size_y = 0;
let heatmap_binarized = null;
let labels = null;
let max_size = 0;
let resize_factor_display = 0;
let height_display = 0;
let width_display = 0;
let frame_display = null;
let points_display_resize_factor_x = 0;
let points_display_resize_factor_y = 0;
let size_display = null;
let is_frame_wider = null;

let timeForFPSCount = performance.now();
let timeForFPSCountOld = timeForFPSCount;
let frameIndex = 0
let FPS = 0.0
let CountFPSIndex = 0

let net = null;


zone_y1 = 0;
zone_y2 = 0;
zone_x1 = 0;
zone_x2 = 0;
let up_zone_rect = null;
let down_zone_rect = null;
let left_zone_rect = null;
let right_zone_rect = null;

let message_index_old = 5;

let frame_display_photo = null;

let success_frame_no = 0

let is_mobile = true;

let n_points_detected = 0;
let points = Array.from(Array(PASSPORT_N_POINTS), () => new Array(2));
for (let index = 0; index < PAGE_N_POINTS; index++) {
    points[index][0] = 0;
    points[index][1] = 0;
}
let points_states = new Array(PASSPORT_N_POINTS).fill(NOT_DETECTED); 

let is_up_page_successful = false;
let points_up_page = Array.from(Array(PAGE_N_POINTS), () => new Array(2));
for (let index = 0; index < PAGE_N_POINTS; index++) {
    points_up_page[index][0] = 0;
    points_up_page[index][1] = 0;
}
let points_states_up_page = new Array(PAGE_N_POINTS).fill(0);

let is_down_page_successful = false;
let points_down_page = Array.from(Array(PAGE_N_POINTS), () => new Array(2));
for (let index = 0; index < PAGE_N_POINTS; index++) {
    points_down_page[index][0] = 0;
    points_down_page[index][1] = 0;
}
let points_states_down_page = new Array(PAGE_N_POINTS).fill(0);

let point_up = new Array(2).fill(0);
let point_up_fast = new Array(2).fill(0);
let point_up_slow = new Array(2).fill(0);
let filter_up_fast = null;
let filter_up_slow = null;

let point_down = new Array(2).fill(0);
let point_down_fast = new Array(2).fill(0);
let point_down_slow = new Array(2).fill(0);
let filter_down_fast = null;
let filter_down_slow = null;



function roundAdvancedWithMultiplier(inp, multiplier) {
    return Math.floor(inp / multiplier + 0.5) * multiplier;
}

function roundAdvanced(inp) {
    return Math.floor(10.0 * (inp + 0.5)) / 10.0;
}

function roundSimple(inp) {
    return Math.floor(inp + 0.5);
}



function processPage(points, points_states, indexes, points_page, points_states_page) {
    let n_points_page = 0;
    for (let index = 0; index < PAGE_N_POINTS; index++) {
        let point_index = indexes[index];
        points_page[index][0] = points[point_index][0];
        points_page[index][1] = points[point_index][1];
        points_states_page[index] = points_states[point_index];
        if (points_states_page[index] == DETECTED) {
            n_points_page++;
        }
        
    }
    
    //console.log(`points_page[0] = `, points_page[0]);
    
    let is_page_successful = false;
    switch(n_points_page) {
        
        case 4:
        is_page_successful = true;
        break;
        
        case 3:
        is_page_successful = true;
        let index_to_recover = -1;
        for (let index = 0; index < PAGE_N_POINTS; index++) {
            if (points_states_page[index] == NOT_DETECTED) {
                index_to_recover = index;
                break;
            }
        }
        // formula to recover:
        // r_i = r_i-1 + r_i+1 - r_i-2
        
        let index_1 = index_to_recover - 1;
        index_1 = (PAGE_N_POINTS + index_1) % PAGE_N_POINTS;
        
        let index_2 = index_to_recover + 1;
        index_2 = (PAGE_N_POINTS + index_2) % PAGE_N_POINTS;
        
        let index_3 = index_to_recover - 2;
        index_3 = (PAGE_N_POINTS + index_3) % PAGE_N_POINTS;
        
        
        points_states_page[index_to_recover] = RECOVERED;
        points_page[index_to_recover][0] = points_page[index_1][0] + points_page[index_2][0] - points_page[index_3][0];
        points_page[index_to_recover][1] = points_page[index_1][1] + points_page[index_2][1] - points_page[index_3][1];
        
        break;
        
        case 2:
        is_page_successful = true;
        let indexes_to_recover = new Array(2).fill(0); 
        let indexes_to_recover_index = 0
        for (let index = 0; index < PAGE_N_POINTS; index++) {
            if (points_states_page[index] == NOT_DETECTED) {
                indexes_to_recover[indexes_to_recover_index] = index;
                if (indexes_to_recover_index >= 1) {
                    break;
                } else {
                    indexes_to_recover_index++;
                }
            }
        }
        
        let is_close = false;
        if ((indexes_to_recover[1] - indexes_to_recover[0]) == 1) {
            is_close = true;
        }
        if (indexes_to_recover[0] == 0 && indexes_to_recover[1] == 3) {
            indexes_to_recover[0] = 3;
            indexes_to_recover[1] = 0; // to fix not clockwise order for this case
            is_close = true;
        }
        
        if (is_close) {
            // close base points
            let multiplier_tmp = 0;
            if (indexes_to_recover[0] % 2 == 0) {
                // recover - horizontal, base - horizontal
                multiplier_tmp = 1 / PAGE_ASPECT_RATIO;
            } else {
                // recover - verticle, base - verticle
                multiplier_tmp = PAGE_ASPECT_RATIO;
            }
            
            let index_0 = indexes_to_recover[0] - 2;
            index_0 = (PAGE_N_POINTS + index_0) % PAGE_N_POINTS;
            
            let index_1 = index_0 + 1;
            index_1 = (PAGE_N_POINTS + index_1) % PAGE_N_POINTS;
            
            let index_2 = index_1 + 1;
            index_2 = (PAGE_N_POINTS + index_2) % PAGE_N_POINTS;
            
            let index_3 = index_2 + 1;
            index_3 = (PAGE_N_POINTS + index_3) % PAGE_N_POINTS;
            
            
            let v_0_x = points_page[index_1][0] - points_page[index_0][0];
            let v_0_y = points_page[index_1][1] - points_page[index_0][1];
            
            
            // rotate at 90 clockwise and scale:
            let v_1_x = -v_0_y * multiplier_tmp;
            let v_1_y = v_0_x * multiplier_tmp;
            
            points_states_page[index_2] = RECOVERED;
            points_page[index_2][0] = points_page[index_1][0] + v_1_x;
            points_page[index_2][1] = points_page[index_1][1] + v_1_y;
            
            points_states_page[index_3] = RECOVERED;
            points_page[index_3][0] = points_page[index_2][0] - v_0_x;
            points_page[index_3][1] = points_page[index_2][1] - v_0_y;
            
        } else {
            // far from each other base points
            // must be 0, 2 or 1, 3
            if (indexes_to_recover[0] == 0) {
                // 0, 2 - to recover; 1, 3 - base
                
                let x1 = points_page[3][0];
                let y1 = points_page[1][1];
                
                let x2 = points_page[1][0];
                let y2 = points_page[3][1];
                
                points_states_page[0] = RECOVERED;
                points_page[0][0] = x1;
                points_page[0][1] = y1;
                
                points_states_page[2] = RECOVERED;
                points_page[2][0] = x2;
                points_page[2][1] = y2;
                
            } else {
                // 1, 3 - to recover; 0, 2 - base
                let x1 = points_page[0][0];
                let y1 = points_page[0][1];
                
                let x2 = points_page[2][0];
                let y2 = points_page[2][1];
                
                points_states_page[1] = RECOVERED;
                points_page[1][0] = x2;
                points_page[1][1] = y1;
                
                points_states_page[3] = RECOVERED;
                points_page[3][0] = x1;
                points_page[3][1] = y2;
                
            }
            
        }
        
        break;
        
    }
    
    return is_page_successful;
}

function unitePoints(point_up, point_up_state, point_down, point_down_state, point_index, points_, points_states_) {
    if (point_up_state == DETECTED) {
        // must be same points
        points_states_[point_index] = point_up_state;
        points_[point_index][0] = point_up[0];
        points_[point_index][1] = point_up[1];
        return;
    }
    
    if (point_down_state == DETECTED) {
        points_states_[point_index] = point_down_state;
        points_[point_index][0] = point_down[0];
        points_[point_index][1] = point_down[1];
        return;
    }
    
    //here must be both point_down_state != DETECTED  point_up_state != DETECTED
    
    if (point_up_state == RECOVERED && point_down_state == NOT_DETECTED) {
        points_states_[point_index] = point_up_state;
        points_[point_index][0] = point_up[0];
        points_[point_index][1] = point_up[1];
        return;
    }
    
    if (point_up_state == NOT_DETECTED && point_down_state == RECOVERED) {
        points_states_[point_index] = point_down_state;
        points_[point_index][0] = point_down[0];
        points_[point_index][1] = point_down[1];
        return;
    }
    
    if (point_up_state == RECOVERED && point_down_state == RECOVERED) {
        points_states_[point_index] = point_up_state;
        points_[point_index][0] = (point_up[0] + point_down[0]) / 2;
        points_[point_index][1] = (point_up[1] + point_down[1]) / 2;
        return;
    }
    
    if (point_up_state == NOT_DETECTED && point_down_state == NOT_DETECTED) {
        // just pass not detected state
        points_states_[point_index] = point_up_state;
        points_[point_index][0] = point_up[0];
        points_[point_index][1] = point_up[1];
        return;
    }
    
    
}

function make_zone_green(zone) {
    let zone_splited = new cv.MatVector();
    cv.split(zone, zone_splited);
    let zone_R = zone_splited.get(0);
    let zone_G = zone_splited.get(1);
    let zone_B = zone_splited.get(2);
    zone_R.convertTo(zone_R, cv.CV_8UC1, alpha=0.8, beta=0);
    zone_G.convertTo(zone_G, cv.CV_8UC1, alpha=0.5, beta=127);
    zone_B.convertTo(zone_B, cv.CV_8UC1, alpha=0.8, beta=0);
    cv.merge(zone_splited, zone);
    zone_splited.delete();
    zone_R.delete();
    zone_G.delete();
    zone_B.delete();
}

class EmaFilter {
    // exponential mooving avarage filter with bias correction
    // https://medium.com/datadriveninvestor/exponentially-weighted-average-for-deep-neural-networks-39873b8230e9
    // https://www.coursera.org/lecture/deep-neural-network/bias-correction-in-exponentially-weighted-averages-XjuhD
    
    constructor(smooth_width) {
        this.alpha = 2.0 / (smooth_width + 1);
        this.beta = 1.0 - this.alpha;
        this.for_beta_power = this.beta;
        this.smoothed_value_prev = 0.0;
    }
    
    step(value) {
        
        this.smoothed_value = this.alpha * value + this.beta * this.smoothed_value_prev;
        this.smoothed_value_bias_corrected = this.smoothed_value / (1.0 - this.for_beta_power);
        
        this.for_beta_power *= this.beta;
        this.smoothed_value_prev = this.smoothed_value;
        
        return this.smoothed_value_bias_corrected;
    }
    
    reset() {
        this.for_beta_power = this.beta;
        this.smoothed_value_prev = 0.0;
    }
}

class EmaFilter2D {
    
    constructor(smooth_width) {
        this.smooth_width = smooth_width;
        this.filter_x = new EmaFilter(smooth_width);
        this.filter_y = new EmaFilter(smooth_width);
        this.index = 0;
    }
    
    step(value, value_output) {
        value_output[0] = this.filter_x.step(value[0]);
        value_output[1] = this.filter_y.step(value[1]);
        this.index++;
    }
    
    reset() {
        this.filter_x.reset();
        this.filter_y.reset();
        this.index = 0;
    }
    
    is_saturated() {
        return this.index >= this.smooth_width;
    }
}

function find_page_center(points, indexes, point_center) {
    point_center[0] = 0;
    point_center[1] = 0;
    for (let index = 0; index < PAGE_N_POINTS; index++) {
        let point_index = indexes[index];
        point_center[0] += points[point_index][0];
        point_center[1] += points[point_index][1];
    }
    point_center[0] = point_center[0] / PAGE_N_POINTS;
    point_center[1] = point_center[1] / PAGE_N_POINTS;
}

function dist_2d(point_1, point_2) {
    let diff_x = point_1[0] - point_2[0];
    let diff_y = point_1[1] - point_2[1];
    return Math.sqrt(diff_x * diff_x + diff_y * diff_y);
}

const mobileDetect = () => {
  let check = false;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    check = true;
  }
  return check;
};

function startCamera() {
  if (streaming) return;
  is_mobile = mobileDetect();
  let camera_settings = null;
  if(is_mobile) {
      camera_settings = {video: resolution, audio: false, facingMode: "environment"};
      IS_MIRROR = false;
  } else {
      camera_settings = {video: resolution, audio: false};
      IS_MIRROR = true;
  }
  navigator.mediaDevices.getUserMedia(camera_settings)
    .then(function(s) {
    stream = s;
    video.srcObject = s;
    video.play();
    function step() {
      if (streaming) {
          let isCountFPS = frameIndex % N_FRAMES_FPS_COUNT == 0;
          
          if (isCountFPS) {
              timeForFPSCount = performance.now();
          }
          
          videoCapture.read(frame);
          
          //cv.resize(frame, frame_small, size_small, 0, 0, cv.INTER_LINEAR);
          //cv.putText(frame_small, `FPS: ${roundAdvanced(FPS)}  ${frameIndex}  ${width}x${height}`, {x: 10, y: 15}, cv.FONT_HERSHEY_SIMPLEX, 0.4, [255, 0, 0, 255]);
          //cv.imshow('canvasOutput', frame_small);
          
          cv.cvtColor(frame, frame_rgb, cv.COLOR_RGBA2RGB);
          cv.resize(frame_rgb, frame_inside, size_inside, 0, 0, cv.INTER_LINEAR);
          cv.resize(frame_rgb, frame_display, size_display, 0, 0, cv.INTER_LINEAR);
          frame_display.copyTo(frame_display_photo);
          frame_display
          if (IS_MIRROR) {
              cv.flip(frame_display, frame_display, +1);
          }
          cv.copyMakeBorder(frame_inside, frame_net_input, PAD_SIZE, PAD_SIZE, PAD_SIZE, PAD_SIZE, cv.BORDER_CONSTANT, [0, 0, 0, 255]);
          const tf_processing = tf.tidy(() => {
              const frame_tf = tf.tensor(frame_net_input.data, shape= [net_input_size_y, net_input_size_x, 3]).toFloat();
              const offset = tf.scalar(255);
              const frame_normailzed_tf = frame_tf.div(offset);

              const frame_batched_tf = frame_normailzed_tf.reshape([1, net_input_size_y, net_input_size_x, 3]);
              return net.predict(frame_batched_tf).squeeze();
          });
          //await tf_processing.arraySync();
          tf_processing.arraySync();
          
          
          //cv.putText(frame_net_input, `FPS: ${roundAdvanced(FPS)}  ${frameIndex}  ${width}x${height}`, {x: 10, y: 15}, cv.FONT_HERSHEY_SIMPLEX, 0.4, [255, 0, 0, 255]);
          //cv.imshow('canvasOutput', frame_net_input);
          
          let is_all_points = 1;
          n_points_detected = 0;
          const heatmaps = tf.split(tf_processing, PASSPORT_N_POINTS, 2);
          heatmaps.map((heatmap, index)=>{
            const heatmap_cliped = heatmap.dataSync().map((pixel) => pixel < 0.0 ? 0.0 : pixel > 1.0 ? 1.0 : pixel*255)
            const heatmap_cv = cv.matFromArray(net_output_size_y, net_output_size_x, cv.CV_8UC1, heatmap_cliped);
            //cv.imshow('crop'+ index, heatmap_cv);
            cv.threshold(heatmap_cv, heatmap_binarized, THRESHOLD, 255, cv.THRESH_BINARY);
            const stats = new cv.Mat ();// value and area value forming the bounding box
            const centroids = new cv.Mat ();// centroid (x, y) (CV_64FC1)
            let n_labels = cv.connectedComponentsWithStats(heatmap_binarized, labels, stats, centroids, 4, cv.CV_16U);
            
            points_states[index] = NOT_DETECTED;
            if (n_labels > 1)
            {
                
                let max_ind = -1;
                let max_area = -1;
                for (let component_index = 1; component_index < n_labels; component_index++) {
                    let area = stats.data32S[N_CC_STATS_MEASURES * component_index + cv.CC_STAT_AREA];
                    if (area > max_area) {
                        max_area = area;
                        max_ind = component_index;
                    }
                }
                
                let pixel_index = 0;
                let x_spot_out = 0.0;
                let y_spot_out = 0.0;
                let weights_sum = 0.0;
                for (let y = 0; y < net_output_size_y; y++) {
                    for (let x = 0; x < net_output_size_x; x++) {
                        if(labels.data16U[pixel_index] == max_ind) {
                            
                            weights_sum += heatmap_cv.data[pixel_index];  
                            x_spot_out += heatmap_cv.data[pixel_index] * x;
                            y_spot_out += heatmap_cv.data[pixel_index] * y;
                        }
                        pixel_index++;
                    }
                }
                //console.log(weights_sum);
                x_spot_out /= weights_sum;
                y_spot_out /= weights_sum;
                x_spot = Math.round((x_spot_out + 0.5) * NET_SCALE - 0.5);
                y_spot = Math.round((y_spot_out + 0.5) * NET_SCALE - 0.5);
                x_spot -= PAD_SIZE
                y_spot -= PAD_SIZE
                x_spot *= points_display_resize_factor_x;
                y_spot *= points_display_resize_factor_y;
                
                n_points_detected += 1
                points_states[index] = DETECTED;
                points[index][0] = x_spot;
                points[index][1] = y_spot;
            } else {
                is_all_points = 0;
            }
          });
          
          is_up_page_successful = processPage(points, points_states, UP_PAGE_POINTS_INDEXES, points_up_page, points_states_up_page);
          is_down_page_successful = processPage(points, points_states, DOWN_PAGE_POINTS_INDEXES, points_down_page, points_states_down_page);
          
          
          
          let is_passport_detected = is_up_page_successful && is_down_page_successful;
          
          
          points_states[0] = points_states_up_page[0];
          points[0][0] = points_up_page[0][0];
          points[0][1] = points_up_page[0][1];
          
          points_states[1] = points_states_up_page[1];
          points[1][0] = points_up_page[1][0];
          points[1][1] = points_up_page[1][1];
          
          unitePoints(points_up_page[3], points_states_up_page[3], points_down_page[0], points_states_down_page[0], 5, points, points_states);
          unitePoints(points_up_page[2], points_states_up_page[2], points_down_page[1], points_states_down_page[1], 2, points, points_states);
          
          
          points_states[3] = points_states_down_page[2];
          points[3][0] = points_down_page[2][0];
          points[3][1] = points_down_page[2][1];
          
          points_states[4] = points_states_down_page[3];
          points[4][0] = points_down_page[3][0];
          points[4][1] = points_down_page[3][1];
          
          if (is_frame_wider) {
          
              let up_zone = new cv.Mat();
              up_zone = frame_display.roi(up_zone_rect);
              make_zone_green(up_zone);
              up_zone.delete();
              
              let down_zone = new cv.Mat();
              down_zone = frame_display.roi(down_zone_rect);
              make_zone_green(down_zone);
              down_zone.delete();
          } else {
          
              let left_zone = new cv.Mat();
              left_zone = frame_display.roi(left_zone_rect);
              make_zone_green(left_zone);
              left_zone.delete();
              
              let right_zone = new cv.Mat();
              right_zone = frame_display.roi(right_zone_rect);
              make_zone_green(right_zone);
              right_zone.delete();
          }
          

          let all_ok = false;
          let all_all_ok = false;
          if (is_passport_detected) {
              let is_within_frame = true;
              for (let point_index = 0; point_index < PASSPORT_N_POINTS; point_index++) {
                  let xt_1 = points[point_index][0];
                  let yt_1 = points[point_index][1];
                  if (xt_1 < 0) {
                      is_within_frame = false;
                      break;
                  }
                  if (xt_1 >= width_display) {
                      is_within_frame = false;
                      break;
                  }
                  if (yt_1 < 0) {
                      is_within_frame = false;
                      break;
                  }
                  if (yt_1 >= height_display) {
                      is_within_frame = false;
                      break;
                  }
              }
              if (is_within_frame) {
                  let in_zone = true;
                  if (is_frame_wider) {
                      in_zone = in_zone && (points[0][1] <= zone_y1);
                      in_zone = in_zone && (points[1][1] <= zone_y1);
                      in_zone = in_zone && (points[3][1] >= zone_y2);
                      in_zone = in_zone && (points[4][1] >= zone_y2);
                      if (in_zone) {
                          all_ok = true;
                      } else {
                          status(3);
                      }
                  
                  } else {
                      in_zone = in_zone && (points[0][0] <= zone_x1);
                      in_zone = in_zone && (points[5][0] <= zone_x1);
                      in_zone = in_zone && (points[4][0] <= zone_x1);
                      in_zone = in_zone && (points[1][0] >= zone_x2);
                      in_zone = in_zone && (points[2][0] >= zone_x2);
                      in_zone = in_zone && (points[3][0] >= zone_x2);
                      if (in_zone) {
                          all_ok = true;
                      } else {
                          status(4);
                      }
                  }
              } else {
                  status(2);
              }
                  
          } else {
              status(1);
          }
          
          if (is_up_page_successful) {
              find_page_center(points, UP_PAGE_POINTS_INDEXES, point_up);
              filter_up_fast.step(point_up, point_up_fast);
              filter_up_slow.step(point_up, point_up_slow);
          } else {
              filter_up_fast.reset();
              filter_up_slow.reset();
          }
          
          if (is_down_page_successful) {
              find_page_center(points, DOWN_PAGE_POINTS_INDEXES, point_down);
              filter_down_fast.step(point_down, point_down_fast);
              filter_down_slow.step(point_down, point_down_slow);
          } else {
              filter_down_fast.reset();
              filter_down_slow.reset();
          }
          
          {
              let point_tmp1_1 = null;
              let point_tmp1_2 = null;
              if (IS_MIRROR) {
                  point_tmp1_1 = {x: width_display - point_up_fast[0], y: point_up_fast[1]};
                  point_tmp1_2 = {x: width_display - point_up_slow[0], y: point_up_slow[1]};
              } else {
                  point_tmp1_1 = {x: point_up_fast[0], y: point_up_fast[1]};
                  point_tmp1_2 = {x: point_up_slow[0], y: point_up_slow[1]};
              }
              cv.circle(frame_display, point_tmp1_1, 3, [255, 0, 0, 255]);
              cv.circle(frame_display, point_tmp1_2, 5, [0, 255, 0, 255]);
          
              point_tmp1_1 = null;
              point_tmp1_2 = null;
              if (IS_MIRROR) {
                  point_tmp1_1 = {x: width_display - point_down_fast[0], y: point_down_fast[1]};
                  point_tmp1_2 = {x: width_display - point_down_slow[0], y: point_down_slow[1]};
              } else {
                  point_tmp1_1 = {x: point_down_fast[0], y: point_down_fast[1]};
                  point_tmp1_2 = {x: point_down_slow[0], y: point_down_slow[1]};
              }
              cv.circle(frame_display, point_tmp1_1, 3, [255, 0, 0, 255]);
              cv.circle(frame_display, point_tmp1_2, 5, [0, 255, 0, 255]);
          }
          
          if (all_ok) {
              let is_slow_motion = false;
              if (is_passport_detected) {
                  if (filter_up_slow.is_saturated() && filter_down_slow.is_saturated()) {
                      if (CountFPSIndex >= 1)  {
                          let slow_motion_dist_threshold = slow_motion_dist_threshold_per_sec / FPS;
                          
                          let dist_up = dist_2d(point_up_fast, point_up_slow);
                          let dist_down = dist_2d(point_down_fast, point_down_slow);
                          if (dist_up <= slow_motion_dist_threshold && dist_down <= slow_motion_dist_threshold) {
                              is_slow_motion = true;        
                          }
                      }
                  }
              }
              if (is_slow_motion) {
                  all_all_ok = true;
                  if (success_frame_no >= START_PHOTO_AT_SUCCESS_FRAME_NO) {
                      status(0);
                      cv.putText(frame_display_photo, `${frameIndex}`, {x: 10, y: 15}, cv.FONT_HERSHEY_SIMPLEX, 0.4, [255, 0, 0, 255]);
                      cv.imshow("canvasOutputPhoto", frame_display_photo);
                  }
              } else {
                  status(6);
              }
          }
          
          if (all_all_ok) {
              success_frame_no++;
          } else {
              success_frame_no = 0;
          }
          
          
          

          
          for (let point_index = 0; point_index < PASSPORT_N_POINTS; point_index++) {
              if (points_states[point_index] != NOT_DETECTED) {
                  let xt_1 = points[point_index][0];
                  let yt_1 = points[point_index][1];
                  let point_1 = null;
                  if (IS_MIRROR) {
                      point_1 = {x: width_display - xt_1, y: yt_1};
                  } else {
                      point_1 = {x: xt_1, y: yt_1};
                  }
                  let color = [255, 255, 0, 255];
                  if (points_states[point_index] == RECOVERED) {
                      color = [255, 0, 0, 255];
                  }
                  //console.log(point_1);
                  //console.log(color);
                  cv.circle(frame_display, point_1, 5, color);
                  
              }
          }
          
          if (is_passport_detected) {
              for (let point_index = 0; point_index < PASSPORT_N_POINTS; point_index++) {
                  let point_index_2 = (point_index + 1) % PASSPORT_N_POINTS;
                  if ((points_states[point_index] != NOT_DETECTED) && (points_states[point_index_2] != NOT_DETECTED)) {
                      let xt_1 = points[point_index][0];
                      let yt_1 = points[point_index][1];
                      let xt_2 = points[point_index_2][0];
                      let yt_2 = points[point_index_2][1];
                      let color = [255, 255, 0, 255];
                      if (points_states[point_index] == RECOVERED || points_states[point_index_2] == RECOVERED) {
                          color = [255, 0, 0, 255];
                      }
                      let point_1 = null;
                      let point_2 = null;
                      if (IS_MIRROR) {
                          point_1 = {x: width_display - xt_1, y: yt_1};
                          point_2 = {x: width_display - xt_2, y: yt_2};
                      } else {
                          point_1 = {x: xt_1, y: yt_1};
                          point_2 = {x: xt_2, y: yt_2};
                      }
                      cv.line(frame_display, point_1, point_2, color, 1);
                  }
              }
              let point_index = 2;
              let point_index_2 = 5;
              if ((points_states[point_index] != NOT_DETECTED) && (points_states[point_index_2] != NOT_DETECTED)) {
                  let xt_1 = points[point_index][0];
                  let yt_1 = points[point_index][1];
                  let xt_2 = points[point_index_2][0];
                  let yt_2 = points[point_index_2][1];
                  let color = [255, 255, 0, 255];
                  if (points_states[point_index] == RECOVERED || points_states[point_index_2] == RECOVERED) {
                      color = [255, 0, 0, 255];
                  }
                  let point_1 = null;
                  let point_2 = null;
                  if (IS_MIRROR) {
                      point_1 = {x: width_display - xt_1, y: yt_1};
                      point_2 = {x: width_display - xt_2, y: yt_2};
                  } else {
                      point_1 = {x: xt_1, y: yt_1};
                      point_2 = {x: xt_2, y: yt_2};
                  }
                  cv.line(frame_display, point_1, point_2, color, 1);
              }
          }
          

          cv.putText(frame_display, `FPS: ${roundAdvanced(FPS)}  ${frameIndex}`, {x: 10, y: 15}, cv.FONT_HERSHEY_SIMPLEX, 0.4, [255, 0, 0, 255]);

          cv.imshow('canvasOutput', frame_display);
          
          if (isCountFPS) {
              let timeDelta = timeForFPSCount - timeForFPSCountOld;
              let timeDeltaSec = timeDelta / 1000;
              FPS = N_FRAMES_FPS_COUNT / timeDeltaSec;
              timeForFPSCountOld = timeForFPSCount;
              CountFPSIndex++;
          }
          
          
          frameIndex += 1;
      }
      //canvasOutputContext.drawImage(video, 0, 0);
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step);
  })
    .catch(function(err) {
    console.log("An error occured! " + err);
  });

  video.addEventListener("canplay", function(ev){
    if (!streaming) {
      height = video.videoHeight;
      width = video.videoWidth;
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      streaming = true;
      videoCapture = new cv.VideoCapture(video);
      frame = new cv.Mat(height, width, cv.CV_8UC4);
      frame_rgb = new cv.Mat(height, width, cv.CV_8UC3);
      frame_aspect_ratio = width / height;
      if (frame_aspect_ratio >= PASSPORT_ASPECT_RATIO) {
          // common heigth
          resize_factor =  PASSPORT_TRAIN_SIZE_PX_Y / height;
      } else {
          // common width
          resize_factor =  PASSPORT_TRAIN_SIZE_PX_X / width;
      }
      height_inside = roundAdvancedWithMultiplier(height * resize_factor, NET_SCALE);
      width_inside = roundAdvancedWithMultiplier(width * resize_factor, NET_SCALE);
      size_inside = new cv.Size(width_inside, height_inside);
      frame_inside = new cv.Mat(height_inside, width_inside, cv.CV_8UC3);
      net_input_size_x = width_inside + 2 * PAD_SIZE;
      net_input_size_y = height_inside + 2 * PAD_SIZE;
      frame_net_input = new cv.Mat(net_input_size_y, net_input_size_x, cv.CV_8UC3);
      net_output_size_x = net_input_size_x / NET_SCALE;
      net_output_size_y = net_input_size_y / NET_SCALE;
      heatmap_binarized = new cv.Mat(net_output_size_y, net_output_size_x, cv.CV_8UC1);
      labels =  new cv.Mat(net_output_size_y, net_output_size_x, cv.CV_16U);
      max_size = Math.max(height, width);
      resize_factor_display = DISPLAY_SIZE / max_size;
      height_display = roundSimple(resize_factor_display * height);
      width_display = roundSimple(resize_factor_display * width);
      size_display = new cv.Size(width_display, height_display);
      frame_display = new cv.Mat(height_display, width_display, cv.CV_8UC3);
      points_display_resize_factor_x = width_display / width_inside;
      points_display_resize_factor_y = height_display / height_inside;
      
      canvasOutput.style.width = width_display.toString();
      canvasOutput.style.height = height_display.toString();
      
      is_frame_wider = frame_aspect_ratio > PASSPORT_ASPECT_RATIO;
      
      zone_y1 = roundSimple(ZONE_SIZE_RELATIVE * height_display);
      zone_y2 = height_display - zone_y1;
      zone_x1 = roundSimple(ZONE_SIZE_RELATIVE * width_display);
      zone_x2 = width_display - zone_x1;
      up_zone_rect = new cv.Rect(0, 0 , width_display, zone_y1);
      down_zone_rect = new cv.Rect(0, zone_y2 , width_display, zone_y1);
      left_zone_rect = new cv.Rect(0, 0 , zone_x1, height_display);
      right_zone_rect = new cv.Rect(zone_x2, 0 , zone_x1, height_display);
      
      frame_display_photo = new cv.Mat(height_display, width_display, cv.CV_8UC3);
      
      filter_up_fast = new EmaFilter2D(FILTER_WINDOW_WIDTH_FAST);
      filter_up_slow = new EmaFilter2D(FILTER_WINDOW_WIDTH_SLOW);
      
      filter_down_fast = new EmaFilter2D(FILTER_WINDOW_WIDTH_FAST);
      filter_down_slow = new EmaFilter2D(FILTER_WINDOW_WIDTH_SLOW);
      
      if (is_frame_wider) {
          slow_motion_dist_threshold_per_sec = SLOW_MOTION_DIST_THRESHOLD_RELATIVE_PER_SEC * height_display;
      } else {
          slow_motion_dist_threshold_per_sec = SLOW_MOTION_DIST_THRESHOLD_RELATIVE_PER_SEC * width_display;
      }
      
      
    }
  }, false);
}

const statusElement = document.getElementById('status');
const status = message_index => {
    if (message_index != message_index_old)
    {
        switch (message_index) {
            
            case 0:
            statusElement.innerHTML = '&nbsp;';
            break;
            
            case 1:
            statusElement.innerHTML = 'поднесите паспорт к камере';
            break;
            
            case 2:
            statusElement.innerHTML = 'паспорт должен быть полностью в кадре';
            break;
            
            case 3:
            statusElement.innerHTML = 'верхний и нижний края паспорта должны быть в зеленой зоне';
            break;
            
            case 4:
            statusElement.innerHTML = 'левый и правый края паспорта должны быть в зеленой зоне';
            break;
            
            case 5:
            statusElement.innerHTML = 'Загрузка...';
            break;
            
            case 6:
            statusElement.innerHTML = 'не двигайте паспорт';
            break;
            
        }
        message_index_old = message_index;
    }
        
}



const main = async () => {
  net = await tf.loadGraphModel(MODEL_PATH);
  startCamera();
}

message_index_old = 5;
status(5);
cv['onRuntimeInitialized']=()=>{
    main();
}
