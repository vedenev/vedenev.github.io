const MODEL_PATH = './tf_model_t082_unfixed/model.json';

let BIG_WIDTH = 4096;
let BIG_HEIGHT = 2160;
let N_FRAMES_FPS_COUNT = 5;
let WIDTH_DISPLAY_RELATIVE_MAX = 0.6;
let HEIGHT_DISPLAY_RELATIVE_MAX = 0.6;

let PAGE_SIZE_MM_X = 125;
let PAGE_SIZE_MM_Y = 88;
let PASSPORT_TRAIN_SIZE_PX_X = 256;
let PASSPORT_TRAIN_SIZE_PX_Y = 364;
let PASSPORT_ASPECT_RATIO = PASSPORT_TRAIN_SIZE_PX_X / PASSPORT_TRAIN_SIZE_PX_Y
let PERSON_PHOTO_X1_MM = 5;
let PERSON_PHOTO_X2_MM = 40;
let PERSON_PHOTO_Y1_MM = 16;
let PERSON_PHOTO_Y2_MM = 61;
let PERSON_PHOTO_X1_RELATIVE = PERSON_PHOTO_X1_MM / PAGE_SIZE_MM_X 
let PERSON_PHOTO_X2_RELATIVE = PERSON_PHOTO_X2_MM / PAGE_SIZE_MM_X 
let PERSON_PHOTO_Y1_RELATIVE = PERSON_PHOTO_Y1_MM / PAGE_SIZE_MM_Y 
let PERSON_PHOTO_Y2_RELATIVE = PERSON_PHOTO_Y2_MM / PAGE_SIZE_MM_Y
let PAD_SIZE = 96;
let NET_SCALE = 32; 
let PASSPORT_N_POINTS = 6;
let N_CHANNELS = 3;
let THRESHOLD = 0.3;

let UP_PAGE_POINTS_INDEXES = [0, 1, 2, 5]; 
let DOWN_PAGE_POINTS_INDEXES = [5, 2, 3, 4];
let PAGE_N_POINTS = 4;
let NOT_DETECTED = 0;
let DETECTED = 1;
let RECOVERED = 2;
let PAGE_ASPECT_RATIO = PAGE_SIZE_MM_X / PAGE_SIZE_MM_Y;  

let ZONE_SIZE_RELATIVE = 0.15;
let GREEN_TRANSPARENT = "rgba(0, 255, 0, 0.5)";
let YELLOW = "rgba(255, 255, 0, 1.0)";
let BLACK = "rgba(0, 0, 0, 1.0)";
let FRAME_LINE_WIDTH = 2;

let FILTER_WINDOW_WIDTH_FAST = 0.8;
let FILTER_WINDOW_WIDTH_SLOW = 5;
let START_PHOTO_AT_SUCCESS_FRAME_NO = 2;
let success_frame_no = 0;
let SLOW_MOTION_DIST_THRESHOLD_RELATIVE_PER_SEC = 0.3; // relative to passport height, [passport_heights per second]
let slow_motion_dist_threshold_per_sec = 0;

// https://unpkg.com/browse/scandit-sdk@4.6.1/src/lib/cameraAccess.ts
let BACK_CAMERA_KEYWORS = [
    "rear",
    "back",
    "rück",
    "arrière",
    "trasera",
    "trás",
    "traseira",
    "posteriore",
    "后面",
    "後面",
    "背面",
    "后置", // alternative
    "後置", // alternative
    "背置", // alternative
    "задней",
    "الخلفية",
    "후",
    "arka",
    "achterzijde",
    "หลัง",
    "baksidan",
    "bagside",
    "sau",
    "bak",
    "tylny",
    "takakamera",
    "belakang",
    "אחורית",
    "πίσω",
    "spate",
    "hátsó",
    "zadní",
    "darrere",
    "zadná",
    "задня",
    "stražnja",
    "belakang",
    "बैक"
  ];


let streaming = false;
let real_settings = null;
let capabilities = null;
let stream = null;
let height = 0;
let width = 0;
let width_display = 0;
let height_display = 0;
let resize_factor_display = 0;
let is_mirror = false;
let height_inside = 0;
let width_inside = 0;
let net_input_size_x = 0;
let net_input_size_y = 0;
let net_output_size_x = 0;
let net_output_size_y = 0;
let is_frame_wider = false;
let zone_y1 = 0;
let zone_y2 = 0;
let zone_x1 = 0;
let zone_x2 = 0;
let connected_components_finder = null;
let is_spot_found = false;
let x_spot_out = 0;
let y_spot_out = 0;
let x_spot = 0;
let y_spot = 0;

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

let points_display_resize_factor_x = 0;
let points_display_resize_factor_y = 0;

let message_index_old = -1;

let video = document.getElementById("video");
video.setAttribute("playsinline", true); // for iphone

let FPSElement = document.getElementById("fps_display");
let statusElement = document.getElementById("status");
let photoStatusElement = document.getElementById("photo_status");
let zoomStatusElement = document.getElementById("zoom_status");


let canvas_display = document.getElementById("canvas_display");
let canvas_display_context = canvas_display.getContext("2d");

let canvas_for_net_hidden = document.getElementById("canvas_for_net_hidden");
let canvas_for_net_hidden_context = canvas_for_net_hidden.getContext("2d");

let canvas_photo = document.getElementById("canvas_photo");
let canvas_photo_context = canvas_photo.getContext("2d");

let timeForFPSCount = performance.now();
let timeForFPSCountOld = timeForFPSCount;
let frameIndex = 0
let FPS = 0.0
let CountFPSIndex = 0
let currentTimeOld = 0.0;

let is_default_constrains = false;
let is_many_cameras = false;
let really_many_cameras = false;

class PreallocatedArray {
    constructor(size) {
        this.size = size;
        this.array = new Uint16Array(size);
        this.array.fill(0);
        this.index = 0;
    }
    
    append(element) {
        this.array[this.index] = element;
        this.index++;
    }
    
    length() {
        return this.index
    }
    
    empty() {
        this.index = 0;
    }
}

class ConnectedComponnentsFinder {
    constructor(height, width) {
        this.width = width;
        this.height = height;
        this.size = width * height;
        this.labels = new Uint16Array(this.size);
        this.labels.fill(0);
        this.fronts = [new PreallocatedArray(this.size), new PreallocatedArray(this.size)];
        this.to_x = new Uint16Array(this.size);
        this.to_y = new Uint16Array(this.size);
        this.to_neighbours = [];
        let x_tmp = 0;
        let y_tmp = 0;
        let pixel_tmp = 0;
        let pixel_tmp_0 = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                
                this.to_x[pixel_tmp_0] = x;
                this.to_y[pixel_tmp_0] = y;
            
                var to_neighbours_tmp = [];
                
                if (x < (width - 1)) {
                    x_tmp = x + 1;
                    y_tmp = y;
                    pixel_tmp = y_tmp * width + x_tmp;
                    to_neighbours_tmp.push(pixel_tmp);
                }
                
                if (y < (height - 1)) {
                    x_tmp = x;
                    y_tmp = y + 1;
                    pixel_tmp = y_tmp * width + x_tmp;
                    to_neighbours_tmp.push(pixel_tmp);
                }
                
                if (x > 0) {
                    x_tmp = x - 1;
                    y_tmp = y;
                    pixel_tmp = y_tmp * width + x_tmp;
                    to_neighbours_tmp.push(pixel_tmp);
                }
                
                if (y > 0) {
                    x_tmp = x;
                    y_tmp = y - 1;
                    pixel_tmp = y_tmp * width + x_tmp;
                    to_neighbours_tmp.push(pixel_tmp);
                }
                
                this.to_neighbours.push(to_neighbours_tmp);
                
                pixel_tmp_0++;
            }
        }
        
    }
    
    find(array, threshold) {
        this.labels.fill(0);
        let index = 0;
        let index_new = 1;
        let label_index = 1;
        let pixel_index_tmp = 0;
        let neighbours = null;
        let neighbour = 0;
        let x = 0;
        let y = 0;
        let weight = 0;
        let x_sum = 0;
        let y_sum = 0;
        let weight_sum = 0;
        let x_mean = 0;
        let y_mean = 0;
        let weight_sum_max = -1;
        let x_mean_max = 0;
        let y_mean_max = 0;
        let is_result_found = false;
        
        for (let pixel_index = 0; pixel_index < this.size; pixel_index++) {
            if ((this.labels[pixel_index] == 0) && (array[pixel_index] >= threshold)) {
                is_result_found = true;
                x_sum = 0;
                y_sum = 0;
                weight_sum = 0;
                this.labels[pixel_index] = label_index;
                x = this.to_x[pixel_index];
                y = this.to_y[pixel_index];
                weight = array[pixel_index];
                x_sum += x * weight;
                y_sum += y * weight;
                weight_sum += weight;
                this.fronts[index].empty();
                this.fronts[index].append(pixel_index);
                while (true) { // front motion loop
                    this.fronts[index_new].empty();
                    for (let front_index = 0; front_index < this.fronts[index].length(); front_index++) {
                        pixel_index_tmp = this.fronts[index].array[front_index];
                        neighbours = this.to_neighbours[pixel_index_tmp];
                        for(let neighbour_index = 0; neighbour_index < neighbours.length; neighbour_index++) {
                            neighbour = neighbours[neighbour_index];
                            if ((this.labels[neighbour] == 0) && (array[neighbour] >= threshold)) {
                                this.labels[neighbour] = label_index;
                                x = this.to_x[neighbour];
                                y = this.to_y[neighbour];
                                weight = array[neighbour];
                                x_sum += x * weight;
                                y_sum += y * weight;
                                weight_sum += weight;
                                this.fronts[index_new].append(neighbour);
                            }
                            
                        }
                    }
                    if (this.fronts[index_new].length() == 0) {
                        break;
                    }
                    // swap:
                    index = 1 - index;
                    index_new = 1 - index_new;
                    
                }
                
                x_mean = x_sum / weight_sum;
                y_mean = y_sum / weight_sum;
                
                if (weight_sum > weight_sum_max) {
                    weight_sum_max = weight_sum;
                    x_mean_max = x_mean;
                    y_mean_max = y_mean;
                }
                
                label_index++;
            }
        }
        
        let result = [is_result_found, x_mean_max, y_mean_max];
        return result;
        
    }
}


//sy = 3;
//sx = 4;
//arr  = [5, 5, 5, 5,
//        5, 5, 5, 5,
//        1, 5, 5, 5]

//sy = 5;
//sx = 6;
//
//let ccf = new ConnectedComponnentsFinder(sy, sx);
//
//let index = 0;
//let result = null;
//
//arr  = [1, 1, 5, 1, 1, 5,
//        1, 1, 5, 1, 1, 5,
//        5, 5, 5, 5, 5, 1,
//        1, 1, 5, 1, 1, 5,
//        1, 1, 5, 1, 1, 5];
//result = ccf.find(arr, 3);
//console.log(result)
////console.log(ccf.labels);
////console.log(ccf.to_neighbours);
//newArr = [];
//index = 0;
//for (let y = 0; y < sy; y++) {
//    newArrTmp = [];
//    for (let x = 0; x < sx; x++) {
//        newArrTmp.push(ccf.labels[index]);
//        index++;
//    }
//    newArr.push(newArrTmp);
//}
//console.log(newArr);
//
//arr  = [1, 1, 1, 1, 1, 1,
//        1, 1, 1, 1, 1, 1,
//        1, 1, 1, 1, 1, 1,
//        1, 1, 1, 1, 1, 1,
//        1, 1, 1, 1, 1, 1];
//result = ccf.find(arr, 3);
//console.log(result)
////console.log(ccf.labels);
////console.log(ccf.to_neighbours);
//newArr = [];
//index = 0;
//for (let y = 0; y < sy; y++) {
//    newArrTmp = [];
//    for (let x = 0; x < sx; x++) {
//        newArrTmp.push(ccf.labels[index]);
//        index++;
//    }
//    newArr.push(newArrTmp);
//}
//console.log(newArr);

//time_tmp_sum = 0;
//time_tmp_n = 0;

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

const status = message_index => {
    if (message_index != message_index_old)
    {
        switch (message_index) {
            
            case 0:
            statusElement.innerHTML = '&nbsp;';
            break;
            
            case 1:
            statusElement.innerHTML = 'поднесите развернутый вертикальный паспорт к камере';
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
            
            case 7:
            statusElement.innerHTML = 'не удалось запустить видеокамеру';
            break;
            
        }
        message_index_old = message_index;
    }
        
}

function frame_processing() {
    canvas_display_context.drawImage(video, 0, 0, width, height, 0, 0, width_display, height_display);
    canvas_for_net_hidden_context.drawImage(canvas_display, 0, 0, width_display, height_display, PAD_SIZE, PAD_SIZE, width_inside, height_inside);
    
    //canvas_tmp_1.width = net_input_size_x;
    //canvas_tmp_1.height = net_input_size_y;
    //canvas_tmp_1_context.drawImage(canvas_for_net_hidden, 0, 0, net_input_size_x, net_input_size_y, 0, 0, net_input_size_x, net_input_size_y);
    
    // https://github.com/tensorflow/tfjs-examples/blob/master/mobilenet/index.js
    const tf_processing = tf.tidy(() => {
        frame_tf = tf.browser.fromPixels(canvas_for_net_hidden, N_CHANNELS).toFloat();
        const offset = tf.scalar(255);
        const frame_normailzed_tf = frame_tf.div(offset);
        const frame_batched_tf = frame_normailzed_tf.reshape([1, net_input_size_y, net_input_size_x, N_CHANNELS]);
        //.mul(offset)
        const prediction = net.predict(frame_batched_tf).squeeze().clipByValue(0, 1);
        //return tf.split(prediction, PASSPORT_N_POINTS, 2);
        return tf.unstack(prediction, 2);
    });
    //await tf_processing.arraySync();
    //tf_processing.arraySync();
    
    //console.log(tf_processing);
    //console.log(net_output_size_y);
    //console.log(net_output_size_x);
    //heatmaps_data = tf_processing.dataSync();
    for(let hitmap_index = 0; hitmap_index < PASSPORT_N_POINTS; hitmap_index++) {
        let heatmap_data = tf_processing[hitmap_index].dataSync();
        
        //if (hitmap_index == 0) {
        //    //let array_tmp = new Uint8ClampedArray(heatmap_data);
        //    let array_tmp = new Uint8ClampedArray(4 * net_output_size_x * net_output_size_y);
        //    for (let pixel_index = 0; pixel_index < net_output_size_x * net_output_size_y; pixel_index++) {
        //        array_tmp[4 * pixel_index] = heatmap_data[pixel_index];
        //        array_tmp[4 * pixel_index + 1] = heatmap_data[pixel_index];
        //        array_tmp[4 * pixel_index + 2] = heatmap_data[pixel_index];
        //        array_tmp[4 * pixel_index + 3] = 255;
        //    }
        //    
        //    let pixel_index_2 = 0;
        //    array_tmp[4 * pixel_index_2] = 255;
        //    array_tmp[4 * pixel_index_2 + 1] = 0;
        //    array_tmp[4 * pixel_index_2 + 2] = 0;
        //    array_tmp[4 * pixel_index_2 + 3] = 255;
        //    
        //    pixel_index_2 = net_output_size_x - 1;
        //    array_tmp[4 * pixel_index_2] = 0;
        //    array_tmp[4 * pixel_index_2 + 1] = 255;
        //    array_tmp[4 * pixel_index_2 + 2] = 0;
        //    array_tmp[4 * pixel_index_2 + 3] = 255;
        //    
        //    pixel_index_2 = (net_output_size_y - 1) * net_output_size_x;
        //    array_tmp[4 * pixel_index_2] = 255;
        //    array_tmp[4 * pixel_index_2 + 1] = 0;
        //    array_tmp[4 * pixel_index_2 + 2] = 0;
        //    array_tmp[4 * pixel_index_2 + 3] = 255;
        //    
        //    let imgData_tmp = new ImageData(array_tmp, net_output_size_x, net_output_size_y);
        //    canvas_tmp_1.width = net_output_size_x;
        //    canvas_tmp_1.height = net_output_size_y;
        //    canvas_tmp_1_context.putImageData(imgData_tmp, 0, 0);
        //}
        
        //let time_tmp_1 = performance.now();
        let cc_result = connected_components_finder.find(heatmap_data, THRESHOLD);
        // time for connected_components_finder.find: 
        // conditions:
        // PASSPORT_TRAIN_SIZE_PX_X = 256;
        // PASSPORT_TRAIN_SIZE_PX_Y = 364;
        // PAD_SIZE = 96;
        // NET_SCALE = 32;
        // AMD Ryzen 7 3800 + GPU
        // a4tech camera
        // time without passport: ~0.0039 sec (256 FPS)
        // time with passport: ~0.0053 sec (188 FPS)
        //let time_tmp_2 = performance.now();
        //time_tmp_sum += time_tmp_2 - time_tmp_1;
        //time_tmp_n++;
        //if (time_tmp_n >= 200) {
        //    time_tmp_mean = time_tmp_sum / time_tmp_n;    
        //    statusElement.innerHTML = time_tmp_mean.toString(10);
        //    time_tmp_sum = 0;
        //    time_tmp_n = 0;
        //}
        
        is_spot_found = cc_result[0];
        points_states[hitmap_index] = NOT_DETECTED;
        if (is_spot_found) {
            x_spot_out = cc_result[1];
            y_spot_out = cc_result[2];
            x_spot = roundSimple((x_spot_out + 0.5) * NET_SCALE - 0.5);
            y_spot = roundSimple((y_spot_out + 0.5) * NET_SCALE - 0.5);
            x_spot -= PAD_SIZE
            y_spot -= PAD_SIZE
            x_spot *= points_display_resize_factor_x;
            y_spot *= points_display_resize_factor_y;
            
            points_states[hitmap_index] = DETECTED;
            points[hitmap_index][0] = x_spot;
            points[hitmap_index][1] = y_spot;
        }


        
    }
    
    
    canvas_display_context.fillStyle = GREEN_TRANSPARENT;
    if(is_frame_wider) {
        canvas_display_context.fillRect(0, 0, width_display, zone_y1);
        canvas_display_context.fillRect(0, zone_y2, width_display, zone_y1);
    } else {
        canvas_display_context.fillRect(0, 0, zone_x1, height_display);
        canvas_display_context.fillRect(zone_x2, 0, zone_x1, height_display);
    }
    
    
    
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
    
    //canvas_display_context.lineWidth = 1;
    //for(let hitmap_index = 0; hitmap_index < PASSPORT_N_POINTS; hitmap_index++) {
    //    if (points_states[hitmap_index] == DETECTED) {
    //        canvas_display_context.strokeStyle = "rgba(255, 255, 0, 1.0)";
    //        canvas_display_context.beginPath();
    //        canvas_display_context.arc(points[hitmap_index][0], points[hitmap_index][1], 5, 0, Math.PI * 2, true);
    //        canvas_display_context.stroke();
    //    }
    //    
    //    if (points_states[hitmap_index] == RECOVERED) {
    //        canvas_display_context.strokeStyle = "rgba(255, 0, 0, 1.0)";
    //        canvas_display_context.beginPath();
    //        canvas_display_context.arc(points[hitmap_index][0], points[hitmap_index][1], 5, 0, Math.PI * 2, true);
    //        canvas_display_context.stroke();
    //    }
    //}
    
    canvas_display_context.lineWidth = 1;
    
    if (is_passport_detected) {
        canvas_display_context.lineWidth = FRAME_LINE_WIDTH;
        canvas_display_context.strokeStyle = YELLOW;
        for (let point_index = 0; point_index < PASSPORT_N_POINTS; point_index++) {
            let point_index_2 = (point_index + 1) % PASSPORT_N_POINTS;
            let xt_1 = points[point_index][0];
            let yt_1 = points[point_index][1];
            let xt_2 = points[point_index_2][0];
            let yt_2 = points[point_index_2][1];
            canvas_display_context.beginPath();
            canvas_display_context.moveTo(xt_1, yt_1); 
            canvas_display_context.lineTo(xt_2, yt_2);
            canvas_display_context.stroke();
        }
        let point_index = 2;
        let point_index_2 = 5;
        let xt_1 = points[point_index][0];
        let yt_1 = points[point_index][1];
        let xt_2 = points[point_index_2][0];
        let yt_2 = points[point_index_2][1];
        canvas_display_context.beginPath();
        canvas_display_context.moveTo(xt_1, yt_1); 
        canvas_display_context.lineTo(xt_2, yt_2);
        canvas_display_context.stroke();
        
        //PERSON_PHOTO_X1_RELATIVE
        
        let tmp_direction_horizontal_x = points[2][0] - points[5][0];
        let tmp_direction_horizontal_y = points[2][1] - points[5][1];
        
        let tmp_direction_verticle_x = points[4][0] - points[5][0];
        let tmp_direction_verticle_y = points[4][1] - points[5][1];
        
        let person_photo_x1 = points[5][0] + tmp_direction_horizontal_x * PERSON_PHOTO_X1_RELATIVE + tmp_direction_verticle_x * PERSON_PHOTO_Y1_RELATIVE;
        let person_photo_y1 = points[5][1] + tmp_direction_horizontal_y * PERSON_PHOTO_X1_RELATIVE + tmp_direction_verticle_y * PERSON_PHOTO_Y1_RELATIVE;
        
        let person_photo_x2 = points[5][0] + tmp_direction_horizontal_x * PERSON_PHOTO_X2_RELATIVE + tmp_direction_verticle_x * PERSON_PHOTO_Y1_RELATIVE;
        let person_photo_y2 = points[5][1] + tmp_direction_horizontal_y * PERSON_PHOTO_X2_RELATIVE + tmp_direction_verticle_y * PERSON_PHOTO_Y1_RELATIVE;
        
        let person_photo_x3 = points[5][0] + tmp_direction_horizontal_x * PERSON_PHOTO_X2_RELATIVE + tmp_direction_verticle_x * PERSON_PHOTO_Y2_RELATIVE;
        let person_photo_y3 = points[5][1] + tmp_direction_horizontal_y * PERSON_PHOTO_X2_RELATIVE + tmp_direction_verticle_y * PERSON_PHOTO_Y2_RELATIVE;
        
        let person_photo_x4 = points[5][0] + tmp_direction_horizontal_x * PERSON_PHOTO_X1_RELATIVE + tmp_direction_verticle_x * PERSON_PHOTO_Y2_RELATIVE;
        let person_photo_y4 = points[5][1] + tmp_direction_horizontal_y * PERSON_PHOTO_X1_RELATIVE + tmp_direction_verticle_y * PERSON_PHOTO_Y2_RELATIVE;
        
        canvas_display_context.beginPath();
        canvas_display_context.moveTo(person_photo_x1, person_photo_y1); 
        canvas_display_context.lineTo(person_photo_x2, person_photo_y2);
        canvas_display_context.stroke();
        
        canvas_display_context.beginPath();
        canvas_display_context.moveTo(person_photo_x2, person_photo_y2); 
        canvas_display_context.lineTo(person_photo_x3, person_photo_y3);
        canvas_display_context.stroke();
        
        canvas_display_context.beginPath();
        canvas_display_context.moveTo(person_photo_x3, person_photo_y3); 
        canvas_display_context.lineTo(person_photo_x4, person_photo_y4);
        canvas_display_context.stroke();
        
        canvas_display_context.beginPath();
        canvas_display_context.moveTo(person_photo_x4, person_photo_y4); 
        canvas_display_context.lineTo(person_photo_x1, person_photo_y1);
        canvas_display_context.stroke();
        
        
        
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
    
    //canvas_display_context.strokeStyle = "rgba(255, 0, 0, 1.0)";
    //canvas_display_context.beginPath();
    //canvas_display_context.arc(point_up_fast[0], point_up_fast[1], 5, 0, Math.PI * 2, true);
    //canvas_display_context.stroke();
    //
    //canvas_display_context.strokeStyle = "rgba(0, 255, 0, 1.0)";
    //canvas_display_context.beginPath();
    //canvas_display_context.arc(point_up_slow[0], point_up_slow[1], 5, 0, Math.PI * 2, true);
    //canvas_display_context.stroke();
    //
    //canvas_display_context.strokeStyle = "rgba(255, 0, 0, 1.0)";
    //canvas_display_context.beginPath();
    //canvas_display_context.arc(point_down_fast[0], point_down_fast[1], 5, 0, Math.PI * 2, true);
    //canvas_display_context.stroke();
    //
    //canvas_display_context.strokeStyle = "rgba(0, 255, 0, 1.0)";
    //canvas_display_context.beginPath();
    //canvas_display_context.arc(point_down_slow[0], point_down_slow[1], 5, 0, Math.PI * 2, true);
    //canvas_display_context.stroke();
    
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
            status(0);
        } else {
            status(6);
        }
    }
    
    let all_all_all_ok = false;
    if (all_all_ok) {
        if (success_frame_no >= START_PHOTO_AT_SUCCESS_FRAME_NO) {
            all_all_all_ok = true;
        }
        success_frame_no++;
    } else {
        success_frame_no = 0;
    }
    
    if (all_all_all_ok) {
        let photo_display_reisize_factor = 0.2;
        let photo_display_width = roundSimple(width * photo_display_reisize_factor);
        let photo_display_height = roundSimple(height * photo_display_reisize_factor);
        canvas_photo.width = photo_display_width;
        canvas_photo.height = photo_display_height;
        canvas_photo_context.drawImage(video, 0, 0, width, height, 0, 0, photo_display_width, photo_display_height);
        photoStatusElement.innerHTML = "фото (кадр номер " + frameIndex.toString(10) + ", " + width.toString(10) + "x" + height.toString(10) + ")";
    }
    
}

function step() {
  if (streaming) {
      
      if (currentTimeOld != video.currentTime) {
  
          let isCountFPS = frameIndex % N_FRAMES_FPS_COUNT == 0;
          
          if (isCountFPS) {
              timeForFPSCount = performance.now();
          }
          
          
          frame_processing();
          
          if (isCountFPS) {
              let timeDelta = timeForFPSCount - timeForFPSCountOld;
              let timeDeltaSec = timeDelta / 1000;
              FPS = N_FRAMES_FPS_COUNT / timeDeltaSec;
              timeForFPSCountOld = timeForFPSCount;
              FPSElement.innerHTML = "FPS: " + FPS.toString(10);
              CountFPSIndex++;
          }
          
          frameIndex += 1;
      }
      currentTimeOld = video.currentTime;
  }
  
  requestAnimationFrame(step);
}

function roundSimple(inp) {
    return Math.floor(inp + 0.5);
}

function roundAdvancedWithMultiplier(inp, multiplier) {
    return Math.floor(inp / multiplier + 0.5) * multiplier;
}

function prepare_global_variables() {
    real_settings = stream.getVideoTracks()[0].getSettings();
    console.log(real_settings);
    capabilities = stream.getVideoTracks()[0].getCapabilities();
    
    // https://googlechrome.github.io/samples/image-capture/update-camera-zoom.html
    //let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    //let is_zoom_supported = supportedConstraints.hasOwnProperty("zoom");
    
    if ('zoom' in real_settings) {
        zoomStatusElement.innerHTML = "zoom:" + real_settings.zoom.toString(10) + " zoom min:" + capabilities.zoom.min.toString(10) + " zoom max:" + capabilities.zoom.max.toString(10) + " zoom step:" + capabilities.zoom.step.toString(10);
    } else {
        zoomStatusElement.innerHTML = "zoom: " + "undefined";
    }
    
    //let zoom_str_append = "";
    //if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    //  //console.log("enumerateDevices() not supported.");
    //  zoom_str_append = zoom_str_append + "<br />" + "enumerateDevices() not supported.";
    //}
    //
    //// List cameras and microphones.
    //
    //navigator.mediaDevices.enumerateDevices()
    //.then(function(devices) {
    //  devices.forEach(function(device) {
    //    if (device.kind === 'videoinput') {
    //        console.log(device.label +
    //                    " id = " + device.deviceId);
    //        zoom_str_append = zoom_str_append + "<br />" + device.label;
    //    }
    //  });
    //  zoomStatusElement.innerHTML = zoomStatusElement.innerHTML + zoom_str_append;
    //})
    //.catch(function(err) {
    //  console.log(err.name + ": " + err.message);
    //});
    //
    //console.log(zoom_str_append);
    
    
    
    width = real_settings.width;
    height = real_settings.height;
        
    let width_display_request = window.innerWidth * WIDTH_DISPLAY_RELATIVE_MAX;
    let height_display_request = window.innerHeight * HEIGHT_DISPLAY_RELATIVE_MAX;
    resize_factor_display = Math.min(width_display_request / width, height_display_request / height);
    width_display = roundSimple(resize_factor_display * width);
    height_display = roundSimple(resize_factor_display * height);
    canvas_display.width = width_display;
    canvas_display.height = height_display;
    if (is_mirror) {
        canvas_display.style = "transform: scaleX(-1)";
    }
    
    //statusElement.innerHTML = "height = " + height.toString(10) + "  " + "width = " + width.toString(10) + "  " + "height_display = " + height_display.toString(10) + "  " + "width_display = " + width_display.toString(10) + " " + "resize_factor_display =" + resize_factor_display.toString(10);
    
    let frame_aspect_ratio = width_display / height_display;
    is_frame_wider = frame_aspect_ratio > PASSPORT_ASPECT_RATIO;
    if (is_frame_wider) {
        // common heigth
        resize_factor =  PASSPORT_TRAIN_SIZE_PX_Y / height_display;
    } else {
        // common width
        resize_factor =  PASSPORT_TRAIN_SIZE_PX_X / width_display;
    }
    height_inside = roundAdvancedWithMultiplier(height_display * resize_factor, NET_SCALE);
    width_inside = roundAdvancedWithMultiplier(width_display * resize_factor, NET_SCALE);
    net_input_size_x = width_inside + 2 * PAD_SIZE;
    net_input_size_y = height_inside + 2 * PAD_SIZE;
    net_output_size_x = net_input_size_x / NET_SCALE;
    net_output_size_y = net_input_size_y / NET_SCALE;
    canvas_for_net_hidden.width = net_input_size_x;
    canvas_for_net_hidden.height = net_input_size_y;
    canvas_for_net_hidden_context.fillStyle = BLACK;
    canvas_for_net_hidden_context.fillRect(0, 0, net_input_size_x, net_input_size_y);
    
    //statusElement.innerHTML = "height_inside = " + height_inside.toString(10) + " width_inside = " + width_inside.toString(10)  + " net_input_size_y = " + net_input_size_y.toString(10) + "  " + "net_input_size_x = " + net_input_size_x.toString(10) + "  " + "height_display = " + height_display.toString(10) + "  " + "width_display = " + width_display.toString(10) + " " + "resize_factor_display =" + resize_factor.toString(10);
    
    zone_y1 = roundSimple(ZONE_SIZE_RELATIVE * height_display);
    zone_y2 = height_display - zone_y1;
    zone_x1 = roundSimple(ZONE_SIZE_RELATIVE * width_display);
    zone_x2 = width_display - zone_x1;
    
    connected_components_finder = new ConnectedComponnentsFinder(net_output_size_y, net_output_size_x);
    
    points_display_resize_factor_x = width_display / width_inside;
    points_display_resize_factor_y = height_display / height_inside;
    
    filter_up_fast = new EmaFilter2D(FILTER_WINDOW_WIDTH_FAST);
    filter_up_slow = new EmaFilter2D(FILTER_WINDOW_WIDTH_SLOW);
    
    filter_down_fast = new EmaFilter2D(FILTER_WINDOW_WIDTH_FAST);
    filter_down_slow = new EmaFilter2D(FILTER_WINDOW_WIDTH_SLOW);
    
    let pasport_height_estimation_display = 0;
    if (is_frame_wider) {
        pasport_height_estimation_display = height_display;
    } else {
        pasport_height_estimation_display = width_display / PASSPORT_ASPECT_RATIO;
    }
    slow_motion_dist_threshold_per_sec = SLOW_MOTION_DIST_THRESHOLD_RELATIVE_PER_SEC * pasport_height_estimation_display;
    
    
    
    status(5);
    
}

const mobileDetect = () => {
    let check = false;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        check = true;
    }
    return check;
};

function start_camera() {
    if (streaming) return;
    is_mobile = mobileDetect();
    
    if (is_mobile) {
        is_mirror = false;
    } else {
        is_mirror = true;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
        is_default_constrains = true;
    } else {
        cameras_labels = [];
        cameras_ids = [];
        navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
            devices.forEach(function(device) {
            if (device.kind === 'videoinput') {
                cameras_labels.push(device.label);
                cameras_ids.deviceId(device.deviceId);
            }
          });
        })
        .catch(function(err) {
            console.log(err.name + ": " + err.message);
        });
        
        
        
        if (cameras_labels.length <= 1) {
            is_default_constrains = true;
        } else {
            if (is_mobile) {
                // to do: select back cameras, sort by MP if possible or invert list and choose first:
                let cameras_labels_new = [];
                let cameras_ids_new = [];
                let cameras_mp_values_new = [];
                let is_all_mp_values = true;
                for (let label_index = 0; label_index < cameras_labels.length; label_index++) {
                    let label_tmp = cameras_labels[label_index].toLowerCase();
                    let is_back = false;
                    for (let keyword_index = 0; keyword_index < BACK_CAMERA_KEYWORS.length; keyword_index++) {
                        if (label_tmp.includes(BACK_CAMERA_KEYWORS[keyword_index])) {
                            is_back = true;
                            break;
                        }
                    }
                    if (is_back) {
                        cameras_labels_new.push(cameras_labels[label_index]);
                        cameras_ids_new.push(cameras_ids[label_index]);
                        let match = cameras_labels[label_index].match(/\b([0-9]+)\s?MP?\b/i);
                        if (match == null) {
                            is_all_mp_values = false;
                        } else {
                            cameras_mp_values_new.push(parseInt(match[1], 10));
                        }
                    }
                }
                if (cameras_labels_new.length != 0) {
                    cameras_labels = cameras_labels_new;
                    cameras_ids = cameras_ids_new;
                    if (is_all_mp_values) {
                        
                    } else {
                        cameras_labels = cameras_labels.reverse();
                        cameras_ids = cameras_ids.reverse();
                    }
                }
                
                    
            }
            // here must be: cameras_labels.length = cameras_ids.length >= 1
            is_many_cameras = true;
        }
        
    }
    
    if (is_default_constrains) {
        if (is_mobile) {
            video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, facingMode: "environment", resizeMode: "none", zoom: false};
        } else {
            video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, resizeMode: "none", zoom: false};
        }
    }
    
    if (is_many_cameras) {
        video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, facingMode: "environment", resizeMode: "none", zoom: false, deviceId: { exact: cameras_ids[0]}};
        if (cameras_labels.length > 1) {
            really_many_cameras = true;
        }
    }
    
    if (really_many_cameras) {
        // to do: add camera selector to the page and organize the callback
        
    }

    //  zoom_str_append = zoom_str_append + "<br />" + "enumerateDevices() not supported.";
    //}
    //
    //// List cameras and microphones.
    //
    //navigator.mediaDevices.enumerateDevices()
    //.then(function(devices) {
    //  devices.forEach(function(device) {
    //    if (device.kind === 'videoinput') {
    //        console.log(device.label +
    //                    " id = " + device.deviceId);
    //        zoom_str_append = zoom_str_append + "<br />" + device.label;
    //    }
    //  });
    //  zoomStatusElement.innerHTML = zoomStatusElement.innerHTML + zoom_str_append;
    //})
    //.catch(function(err) {
    //  console.log(err.name + ": " + err.message);
    //});
        
    
    video_constraints = null;
    camera_constraints = {video: video_constraints, audio: false};
    
    navigator.mediaDevices.getUserMedia(camera_constraints)
        .then(function(s) {
            stream = s;
            video.srcObject = s;
            video.play();
            requestAnimationFrame(step);
        })
        .catch(function(err) {
            console.log("An error occured! " + err);
            status(7);
        });
    
    video.addEventListener("canplay", function(ev){
        if (!streaming) {
            prepare_global_variables();
            streaming = true;
        }
    }, false);
    
}

const main = async () => {
    net = await tf.loadGraphModel(MODEL_PATH);
    start_camera();
}

main();


