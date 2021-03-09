// net parameters:
const MODEL_PATH = './tf_model_t141_unfixed_tmp/model.json';
let PASSPORT_TRAIN_SIZE_PX_X = 256;
let PASSPORT_TRAIN_SIZE_PX_Y = 364;
let PAD_SIZE = 96;
let NET_SCALE = 16;


const MODEL_PATH_FLARE = './tf_model_t203_flare/model.json';
let N_INPUT_CHANNELS_FLARE = 3;
let N_INPUT_CHANNELS_ALL_FLARE = N_INPUT_CHANNELS_FLARE + 3;
let NET_INPUT_SIZE_X_FLARE = 192;
let NET_INPUT_SIZE_Y_FLARE = 272;
let NET_SCALE_FLARE = 2**3; // 8
let NET_OUTPUT_SIZE_X_FLARE = NET_INPUT_SIZE_X_FLARE / NET_SCALE_FLARE;
let NET_OUTPUT_SIZE_Y_FLARE = NET_INPUT_SIZE_Y_FLARE / NET_SCALE_FLARE;
let NET_OUTPUT_SIZE_FLARE = NET_OUTPUT_SIZE_X_FLARE * NET_OUTPUT_SIZE_Y_FLARE;
let BRIGHTNESS_APMPLIFIER = 0.6;
//let FLARE_BRIGHTNESS_THRESHOLD = 6.58; // fpr=0.06719367588932806, tpr=0.5328014184397163, threshold=6.579958, t195
let FLARE_BRIGHTNESS_THRESHOLD = 4.278; // fpr=0.06719, tpr=0.5957, threshold=4.278, t203

//tf.ENV.set('WEBGL_PACK', false);

let START_WITH_ENVIROMENT_CAMERA = true;

let BIG_WIDTH = 4096;
let BIG_HEIGHT = 2160;
let N_FRAMES_FPS_COUNT = 20;
let WIDTH_DISPLAY_RELATIVE_MAX = 0.6;
let HEIGHT_DISPLAY_RELATIVE_MAX = 0.6;

let PAGE_SIZE_MM_X = 125;
let PAGE_SIZE_MM_Y = 88;
let PASSPORT_ASPECT_RATIO = PASSPORT_TRAIN_SIZE_PX_X / PASSPORT_TRAIN_SIZE_PX_Y
let PERSON_PHOTO_X1_MM = 5;
let PERSON_PHOTO_X2_MM = 40;
let PERSON_PHOTO_Y1_MM = 16;
let PERSON_PHOTO_Y2_MM = 61;
let PERSON_PHOTO_X1_RELATIVE = PERSON_PHOTO_X1_MM / PAGE_SIZE_MM_X 
let PERSON_PHOTO_X2_RELATIVE = PERSON_PHOTO_X2_MM / PAGE_SIZE_MM_X 
let PERSON_PHOTO_Y1_RELATIVE = PERSON_PHOTO_Y1_MM / PAGE_SIZE_MM_Y 
let PERSON_PHOTO_Y2_RELATIVE = PERSON_PHOTO_Y2_MM / PAGE_SIZE_MM_Y
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
let RED = "rgba(255, 0, 0, 1.0)";
let GREEN = "rgba(0, 255, 0, 1.0)";
let CYAN = "rgba(0, 255, 255, 1.0)";
let FRAME_LINE_WIDTH = 2;

let FILTER_WINDOW_WIDTH_FAST = 0.8;
let FILTER_WINDOW_WIDTH_SLOW = 5;
let START_PHOTO_AT_SUCCESS_FRAME_NO = 2;
let success_frame_no = 0;
let SLOW_MOTION_DIST_THRESHOLD_RELATIVE_PER_SEC = 0.35; // relative to passport height, [passport_heights per second]
let slow_motion_dist_threshold_per_sec = 0;
let STATUS_MESSAGE_No_ABSENT = -1;

let STATUS_PASSPORT_TO_CAMERA = 0;
let STATUS_PASSPORT_TO_FRAME = 1;
let STATUS_MAKE_PASSPORT_CLARITY = 2;
let STATUS_MAKE_PASSPORT_BRIGHTNESS = 3;
let STATUS_EDGES_UP_DOWN_TO_ZONES = 4;
let STATUS_LEFT_RIGHT_DOWN_TO_ZONES = 5;
let STATUS_DONT_MOVE_PASSPORT = 6;
let STATUS_FLARE_DETECTED = 7;
let STATUS_SUCCESS_DELAY_WAITING = 8;
let STATUS_PHOTO_DONE = 9;

let PAUSE_LENGTH_DOWN = 0.5;
let PAUSE_LENGTH_UP = 2.0;
let BUTTON_DELAY_SEC = 30;


let CROP_SIZE_REQUAREMENT = 50;
let CROP_STANDART_PASSPORT_HEIGHT = 300;
let CROP_BRIGHTNESS_THRESHOLD = 80;
let CROP_CLARITY_THRESHOLD = 350;
let CROP_DATA_GRAY_MAX_SIZE = 20 * CROP_STANDART_PASSPORT_HEIGHT * CROP_STANDART_PASSPORT_HEIGHT; // big value with margin



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
let requestAnimationFrameId = null;
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

let status_message_no = 0;
let message_index_old = STATUS_MESSAGE_No_ABSENT;

let x1_crop = 0;
let x2_crop = 0;
let y1_crop = 0;
let y2_crop = 0;
let dx_crop = 0;
let dy_crop = 0;
let crop_data_gray = new Uint8ClampedArray(CROP_DATA_GRAY_MAX_SIZE);
let laplacian_variation = 0;

// for flare detection:
let xi1 = 0;
let xi2 = 0;
let yi1 = 0;
let yi2 = 0;
let dxi = 0;
let dyi = 0;
let xc1i1 = 0;
let xc1i2 = 0;
let xc2i1 = 0;
let xc2i2 = 0;
let dxc1 = 0;
let dxc2 = 0;
let x1_for_flare = 0;
let x2_for_flare = 0;
let y1_for_flare = 0;
let y2_for_flare = 0;
let dx_for_flare = 0;
let dy_for_flare = 0;
let points_cropped = Array.from(Array(PASSPORT_N_POINTS), () => new Array(2));
for (let index = 0; index < PASSPORT_N_POINTS; index++) {
    points_cropped[index][0] = 0;
    points_cropped[index][1] = 0;
}



let video = document.getElementById("video");
video_play_promise = undefined;
function for_iphone() {
    
    
    ////https://stackoverflow.com/questions/27051662/getusermedia-freezes-in-mobile-browsers
    //video.setAttribute('autoplay', '');
    //video.setAttribute('muted', '');
    //video.setAttribute('playsinline', '');
    
    //video.autoplay = true;
    //video.muted = true;
    //video.playsinline = true;
    
    
}
for_iphone();
//video_play_promise = video.play();


let FPSElement = document.getElementById("fps_display");
let statusElement = document.getElementById("status");
let photoStatusElement = document.getElementById("photo_status");

let canvas_display = document.getElementById("canvas_display");
let canvas_display_context = canvas_display.getContext("2d");

let canvas_for_net_hidden = document.getElementById("canvas_for_net_hidden");
let canvas_for_net_hidden_context = canvas_for_net_hidden.getContext("2d");

let canvas_for_crop_hidden = document.getElementById("canvas_for_crop_hidden");
canvas_for_crop_hidden.height = CROP_STANDART_PASSPORT_HEIGHT;
let canvas_for_crop_hidden_context = canvas_for_crop_hidden.getContext("2d");

let image_up_page_internal_crop_1_hidden = document.getElementById("image_up_page_internal_crop_1_hidden");
image_up_page_internal_crop_1_hidden.width = 1
image_up_page_internal_crop_1_hidden.height = 1
let image_up_page_internal_crop_1_hidden_context = image_up_page_internal_crop_1_hidden.getContext("2d");

let image_up_page_internal_crop_2_hidden = document.getElementById("image_up_page_internal_crop_2_hidden");
image_up_page_internal_crop_2_hidden.width = 1
image_up_page_internal_crop_2_hidden.height = 1
let image_up_page_internal_crop_2_hidden_context = image_up_page_internal_crop_2_hidden.getContext("2d");

let passport_crop_hidden = document.getElementById("passport_crop_hidden");
passport_crop_hidden.width = NET_INPUT_SIZE_X_FLARE;
passport_crop_hidden.height = NET_INPUT_SIZE_Y_FLARE;
let passport_crop_hidden_context = passport_crop_hidden.getContext("2d");

let flare_masks_hidden = document.getElementById("flare_masks_hidden");
flare_masks_hidden.width = NET_INPUT_SIZE_X_FLARE;
flare_masks_hidden.height = NET_INPUT_SIZE_Y_FLARE;
let flare_masks_hidden_context = flare_masks_hidden.getContext("2d");


//let canvas_flare_tmp = document.getElementById("canvas_flare_tmp");
//canvas_flare_tmp.width = NET_OUTPUT_SIZE_X_FLARE;
//canvas_flare_tmp.height = NET_OUTPUT_SIZE_Y_FLARE;
//let canvas_flare_tmp_context = canvas_flare_tmp.getContext("2d");

let canvas_photo = document.getElementById("canvas_photo");
let canvas_photo_context = canvas_photo.getContext("2d");

//let canvas_for_crop_tmp = document.getElementById("canvas_for_crop_tmp");
//let canvas_for_crop_tmp_context = canvas_for_crop_tmp.getContext("2d");

let manual_button = document.getElementById("manual_button");
let button_delay_started = false;
manual_button.onclick = make_photo;



let timeForFPSCount = performance.now();
let timeForFPSCountOld = timeForFPSCount;
let frameIndex = 0
let FPS = 0.0
let CountFPSIndex = 0
let currentTimeOld = 0.0;

let is_camera_selector = false;
let cameras_labels = null;
let cameras_ids = null;
let is_default_constrains = false;
let select = null;

let slow_changing_status = null;

let time_predict_1 = performance.now();
let time_predict_2 = performance.now();
let time_predict_sum = 0;
let time_predict_n = 0;
let time_predict_mean = 0;

function make_photo() {
    let photo_display_reisize_factor = 0.2;
    let photo_display_width = roundSimple(width * photo_display_reisize_factor);
    let photo_display_height = roundSimple(height * photo_display_reisize_factor);
    canvas_photo.width = photo_display_width;
    canvas_photo.height = photo_display_height;
    canvas_photo_context.drawImage(video, 0, 0, width, height, 0, 0, photo_display_width, photo_display_height);
    photoStatusElement.innerHTML = "фото (кадр номер " + frameIndex.toString(10) + ", " + width.toString(10) + "x" + height.toString(10) + ")";
}
    
class SlowChangingStatus {

    constructor(pause_length_down, pause_length_up) {
        this.pause_length_down = pause_length_down * 1000; // seconds to milliseconds
        this.pause_length_up = pause_length_up * 1000; // seconds to milliseconds
        
        this.status_message_no_request = STATUS_MESSAGE_No_ABSENT;
        this.time_request = performance.now();
        this.pause_length_request = 0.0;
        this.is_busy = false;
        
        this.status_message_no_previouse_set = STATUS_MESSAGE_No_ABSENT;
        
        this.time_tmp = this.time_request;
        this.time_delta = 0.0;
        
        this.first_set = true;
        
    }
    
    set(status_message_no_tmp) {
        
        if (this.first_set) {
            this.first_set = false;
            status(status_message_no_tmp);
            this.status_message_no_previouse_set = status_message_no_tmp;
            return;
        }
    
        this.time_tmp = performance.now();
    
        if (this.is_busy) {
            this.time_delta = this.time_tmp - this.time_request;
            if (this.time_delta >= this.pause_length_request) {
                status(this.status_message_no_request);
                this.status_message_no_previouse_set = this.status_message_no_request;
                this.is_busy = false;
            }
        }
        
        if ( ! this.is_busy) {
            if (status_message_no_tmp != this.status_message_no_previouse_set) {
                this.status_message_no_request = status_message_no_tmp;
                this.time_request = this.time_tmp;
                if (status_message_no_tmp > this.status_message_no_previouse_set) {
                    this.pause_length_request = this.pause_length_down;
                } else {
                    this.pause_length_request = this.pause_length_up;
                }
                this.is_busy = true;
            }
        }
    
    }

}

function to_limits(x, size) {
    if (x < 0) {
        x = 0;
    }
    let size_m_1 = size - 1;
    if (x > size_m_1) {
        x = size_m_1;
    }
    return x;
}

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

function draw_passport_lines() {
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
            
            case STATUS_PASSPORT_TO_CAMERA:
            statusElement.innerHTML = 'поднесите развернутый вертикальный паспорт к камере';
            break;
            
            case STATUS_PASSPORT_TO_FRAME:
            statusElement.innerHTML = 'паспорт должен быть полностью в кадре';
            break;
            
            case STATUS_MAKE_PASSPORT_CLARITY:
            statusElement.innerHTML = 'добейтесь более четкого изображения паспорта';
            break;
            
            case STATUS_MAKE_PASSPORT_BRIGHTNESS:
            statusElement.innerHTML = 'улучшите освещение паспорта';
            break;
            
            case STATUS_EDGES_UP_DOWN_TO_ZONES:
            statusElement.innerHTML = 'верхний и нижний края паспорта должны быть в зеленой зоне';
            break;
            
            case STATUS_LEFT_RIGHT_DOWN_TO_ZONES:
            statusElement.innerHTML = 'левый и правый края паспорта должны быть в зеленой зоне';
            break;

            case STATUS_DONT_MOVE_PASSPORT:
            statusElement.innerHTML = 'не двигайте паспорт';
            break;
            
            case STATUS_FLARE_DETECTED:
            statusElement.innerHTML = 'добейтесь отсутсвия бликов и голограмм';
            break;
            
            //case STATUS_SUCCESS_DELAY_WAITING:
            //// do nothing
            //break;
            
            case STATUS_PHOTO_DONE:
            statusElement.innerHTML = 'сфотографировано, см. результат внизу страницы';
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
    time_predict_1 = performance.now();
    
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
    time_predict_2 = performance.now();
    time_predict_sum += time_predict_2 - time_predict_1
    time_predict_n++;
    
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
    
    // for flare detection, for passport color estimation and crop, before add drawnings:
    if (is_passport_detected) {
        // estimate mean passport color from crop of up page
        xi1 = Math.max(points[0][0], points[5][0]);
        xi1 = Math.ceil(xi1);
        xi2 = Math.min(points[1][0], points[2][0]);
        xi2 = Math.ceil(xi2);
        yi1 = Math.max(points[0][1], points[1][1]);
        yi1 = Math.ceil(yi1);
        yi2 = Math.min(points[5][1], points[2][1]);
        yi2 = Math.ceil(yi2);
        dxi = xi2 - xi1;
        dyi = roundSimple(yi2 - yi1);
        xc1i1 = xi1;
        xc1i2 = roundSimple(xi1 + 0.2 * dxi);
        xc2i1 = roundSimple(xi1 + 0.7 * dxi);
        xc2i2 = roundSimple(xi1 + 0.9 * dxi);
        dxc1 = xc1i2 - xc1i1;
        dxc2 = xc2i2 - xc2i1;
        image_up_page_internal_crop_1_hidden_context.drawImage(canvas_display, xc1i1, yi1, dxc1, dyi,   0, 0, 1, 1);
        image_up_page_internal_crop_2_hidden_context.drawImage(canvas_display, xc2i1, yi1, dxc2, dyi,   0, 0, 1, 1);
        
        x1_for_flare = Math.floor(Math.min(points[0][0], points[4][0], points[5][0]));
        x2_for_flare = Math.ceil(Math.max(points[1][0], points[2][0], points[3][0]));
        y1_for_flare = Math.floor(Math.min(points[0][1], points[1][1]));
        y2_for_flare = Math.ceil(Math.max(points[3][1], points[4][1]));
        dx_for_flare = x2_for_flare - x1_for_flare;
        dy_for_flare = y2_for_flare - y1_for_flare;
        passport_crop_hidden_context.drawImage(canvas_display, x1_for_flare, y1_for_flare, dx_for_flare, dy_for_flare,   0, 0, NET_INPUT_SIZE_X_FLARE, NET_INPUT_SIZE_Y_FLARE);
    }
    
    // draw green zones:
    canvas_display_context.fillStyle = GREEN_TRANSPARENT;
    if(is_frame_wider) {
        canvas_display_context.fillRect(0, 0, width_display, zone_y1);
        canvas_display_context.fillRect(0, zone_y2, width_display, zone_y1);
    } else {
        canvas_display_context.fillRect(0, 0, zone_x1, height_display);
        canvas_display_context.fillRect(zone_x2, 0, zone_x1, height_display);
    }

    if ( ! is_passport_detected) {
        return STATUS_PASSPORT_TO_CAMERA;
    }
    
    draw_passport_lines();
    
    
    if ( ! button_delay_started) {
        setTimeout(function() { manual_button.style = "";}, BUTTON_DELAY_SEC * 1000);
        button_delay_started = true;
    }
    
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
    
    if ( ! is_within_frame) {
        return STATUS_PASSPORT_TO_FRAME;
    }
    
    
    let is_clarity = true;
    let is_brightness = true;
    
    x1_crop = Math.max(points[0][0], points[4][0], points[5][0]);
    x2_crop = Math.min(points[1][0], points[2][0], points[3][0]);
    y1_crop = Math.max(points[0][1], points[1][1]);
    y2_crop = Math.min(points[3][1], points[4][1]);
    
    x1_crop = to_limits(x1_crop, width_display);
    x2_crop = to_limits(x2_crop, width_display);
    y1_crop = to_limits(y1_crop, height_display);
    y2_crop = to_limits(y2_crop, height_display);
    
    x1_crop = x1_crop * width / width_display;
    x2_crop = x2_crop * width / width_display;
    y1_crop = y1_crop * height / height_display;
    y2_crop = y2_crop * height / height_display;
    
    
    dx_crop = x2_crop - x1_crop + 1;
    dy_crop = y2_crop - y1_crop + 1;
    if ((dx_crop >= CROP_SIZE_REQUAREMENT) && (dy_crop >= CROP_SIZE_REQUAREMENT)) {
        
        let reisize_factor_2 = CROP_STANDART_PASSPORT_HEIGHT / dy_crop;
        let width_tmp = roundSimple(reisize_factor_2 * dx_crop);

        canvas_for_crop_hidden.width = width_tmp;
        //canvas_for_crop_hidden.height = CROP_STANDART_PASSPORT_HEIGHT; // done before one time
        canvas_for_crop_hidden_context.drawImage(video, x1_crop, y1_crop, dx_crop, dy_crop, 0, 0, width_tmp, CROP_STANDART_PASSPORT_HEIGHT);
        let crop_ImageData = canvas_for_crop_hidden_context.getImageData(0, 0, width_tmp, CROP_STANDART_PASSPORT_HEIGHT);
        let crop_data = crop_ImageData.data;
        // https://stackoverflow.com/questions/53364140/how-can-i-grayscale-a-canvas-image-in-javascript
        let pixel_index_0 = 0;
        let lightness = 0;
        let crop_data_gray_size_orig = crop_data.length / 4;
        let crop_data_gray_size = Math.min(crop_data_gray_size_orig, CROP_DATA_GRAY_MAX_SIZE);
        let brightness_sum = 0;
        for (let pixel_index = 0; pixel_index < crop_data_gray_size; pixel_index ++) {
            brightness = roundSimple(0.299 * crop_data[pixel_index_0] + 0.587 * crop_data[pixel_index_0 + 1] + 0.114 * crop_data[pixel_index_0 + 2]); // like in opencv
            brightness_sum += brightness;
            crop_data_gray[pixel_index] = brightness;
            pixel_index_0 += 4;
        }
        let brightness_mean = brightness_sum / crop_data_gray_size;
        
        //let crop_data_laplacian_tmp = new Uint8ClampedArray(crop_data.length);
        
        let laplacian_value = 0;
        let pixel_index = 0;
        let pixel_index_right = 0;
        let pixel_index_left = 0;
        let pixel_index_up = 0;
        let pixel_index_down = 0;
        let pixel_index_offset = width_tmp;
        let height_from_max_limit_tmp = Math.floor(CROP_DATA_GRAY_MAX_SIZE / width_tmp);
        let height_tmp = Math.min(CROP_STANDART_PASSPORT_HEIGHT, height_from_max_limit_tmp);
        let laplacian_sum = 0;
        let laplacian_squared_sum = 0;
        for (let yt_crop = 1; yt_crop < height_tmp - 1; yt_crop++) {
            pixel_index = pixel_index_offset + 1;
            pixel_index_left = pixel_index - 1;
            pixel_index_right = pixel_index + 1;
            pixel_index_up = pixel_index - width_tmp;
            pixel_index_down = pixel_index + width_tmp;
            
            for (let xt_crop = 1; xt_crop < width_tmp - 1; xt_crop++) {
                
                
                laplacian_value = -4 * crop_data_gray[pixel_index]  +
                     crop_data_gray[pixel_index_right] +
                     crop_data_gray[pixel_index_left] +
                     crop_data_gray[pixel_index_up] +
                     crop_data_gray[pixel_index_down];
                
                //crop_data_laplacian_tmp[4 * pixel_index] = laplacian_value;
                //crop_data_laplacian_tmp[4 * pixel_index + 1] = laplacian_value;
                //crop_data_laplacian_tmp[4 * pixel_index + 2] = laplacian_value;
                //crop_data_laplacian_tmp[4 * pixel_index + 3] = 255;
                
                laplacian_sum += laplacian_value;
                laplacian_squared_sum += laplacian_value * laplacian_value;
                
                pixel_index++;
                pixel_index_right++;
                pixel_index_left++;
                pixel_index_up++;
                pixel_index_down++;
            }
            pixel_index_offset += width_tmp;
        }
        
        //let imgData_tmp = new ImageData(crop_data_laplacian_tmp, width_tmp, CROP_STANDART_PASSPORT_HEIGHT);
        //canvas_for_crop_tmp.width = width_tmp;
        //canvas_for_crop_tmp.height = CROP_STANDART_PASSPORT_HEIGHT;
        //canvas_for_crop_tmp_context.putImageData(imgData_tmp, 0, 0);
        
        let n_tmp = (width_tmp - 2) * (height_tmp - 2);
        let laplacian_mean = laplacian_sum / n_tmp;
        let laplacian_squared_mean = laplacian_squared_sum / n_tmp;
        laplacian_variation = laplacian_squared_mean - laplacian_mean * laplacian_mean;
        
        
        let clarity_relative = laplacian_variation / CROP_CLARITY_THRESHOLD;
        let brightness_relative = brightness_mean / CROP_BRIGHTNESS_THRESHOLD;
        
        if (clarity_relative < 1.0) {
            is_clarity = false;
        }
        
        if (brightness_relative < 1.0) {
            is_brightness = false;
        }
    }
        
    if ( ! is_clarity) {
        return STATUS_MAKE_PASSPORT_CLARITY;
    }
    
    if ( ! is_brightness) {
        return STATUS_MAKE_PASSPORT_BRIGHTNESS;
    }
    
    let in_zone = true;
    if (is_frame_wider) {
        in_zone = in_zone && (points[0][1] <= zone_y1);
        in_zone = in_zone && (points[1][1] <= zone_y1);
        in_zone = in_zone && (points[3][1] >= zone_y2);
        in_zone = in_zone && (points[4][1] >= zone_y2);
    } else {
        in_zone = in_zone && (points[0][0] <= zone_x1);
        in_zone = in_zone && (points[5][0] <= zone_x1);
        in_zone = in_zone && (points[4][0] <= zone_x1);
        in_zone = in_zone && (points[1][0] >= zone_x2);
        in_zone = in_zone && (points[2][0] >= zone_x2);
        in_zone = in_zone && (points[3][0] >= zone_x2);
    }
    
    if ( ! in_zone) {
        if (is_frame_wider) {
            return STATUS_EDGES_UP_DOWN_TO_ZONES;
        } else {
            return STATUS_LEFT_RIGHT_DOWN_TO_ZONES;
        }
    }
    
    let is_slow_motion = false;
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
    
    if ( ! is_slow_motion) {
        return STATUS_DONT_MOVE_PASSPORT;
    }
    
    // flare detection:
    let image_up_page_internal_crop_1_mean_color_ImageData = image_up_page_internal_crop_1_hidden_context.getImageData(0, 0, 1, 1);
    let image_up_page_internal_crop_1_mean_color = image_up_page_internal_crop_1_mean_color_ImageData.data;
    //console.log(image_up_page_internal_crop_1_mean_color) // Uint8ClampedArray(4) [242, 240, 236, 255]
    
    let image_up_page_internal_crop_2_mean_color_ImageData = image_up_page_internal_crop_2_hidden_context.getImageData(0, 0, 1, 1);
    let image_up_page_internal_crop_2_mean_color = image_up_page_internal_crop_2_mean_color_ImageData.data;
    
    let passport_brightness_estimation_colors_R = (dxc1 * image_up_page_internal_crop_1_mean_color[0] + dxc2 * image_up_page_internal_crop_2_mean_color[0]) / (dxc1 + dxc2) / 255.0;
    let passport_brightness_estimation_colors_G = (dxc1 * image_up_page_internal_crop_1_mean_color[1] + dxc2 * image_up_page_internal_crop_2_mean_color[1]) / (dxc1 + dxc2) / 255.0;
    let passport_brightness_estimation_colors_B = (dxc1 * image_up_page_internal_crop_1_mean_color[2] + dxc2 * image_up_page_internal_crop_2_mean_color[2]) / (dxc1 + dxc2) / 255.0;
    
    let brightness_amplifier_r_tmp = BRIGHTNESS_APMPLIFIER / passport_brightness_estimation_colors_R / 255.0; // 255 to not do division on 255 in tf.tidy
    let brightness_amplifier_g_tmp = BRIGHTNESS_APMPLIFIER / passport_brightness_estimation_colors_G / 255.0;
    let brightness_amplifier_b_tmp = BRIGHTNESS_APMPLIFIER / passport_brightness_estimation_colors_B / 255.0;
    
    // prepare masks:
    for (let index_tmp = 0; index_tmp < PASSPORT_N_POINTS; index_tmp++) {
        points_cropped[index_tmp][0] = NET_INPUT_SIZE_X_FLARE * (points[index_tmp][0] - x1_for_flare) / dx_for_flare;
        points_cropped[index_tmp][1] = NET_INPUT_SIZE_Y_FLARE * (points[index_tmp][1] - y1_for_flare) / dy_for_flare;
    }
    
    flare_masks_hidden_context.fillStyle = BLACK;
    flare_masks_hidden_context.fillRect(0, 0, NET_INPUT_SIZE_X_FLARE, NET_INPUT_SIZE_Y_FLARE);
    
    flare_masks_hidden_context.fillStyle = RED;
    flare_masks_hidden_context.beginPath();
    flare_masks_hidden_context.moveTo(points_cropped[0][0], points_cropped[0][1]);
    flare_masks_hidden_context.lineTo(points_cropped[1][0], points_cropped[1][1]);
    flare_masks_hidden_context.lineTo(points_cropped[2][0], points_cropped[2][1]);
    flare_masks_hidden_context.lineTo(points_cropped[5][0], points_cropped[5][1]);
    flare_masks_hidden_context.closePath();
    flare_masks_hidden_context.fill();
    
    flare_masks_hidden_context.fillStyle = GREEN;
    flare_masks_hidden_context.beginPath();
    flare_masks_hidden_context.moveTo(points_cropped[5][0], points_cropped[5][1]);
    flare_masks_hidden_context.lineTo(points_cropped[2][0], points_cropped[2][1]);
    flare_masks_hidden_context.lineTo(points_cropped[3][0], points_cropped[3][1]);
    flare_masks_hidden_context.lineTo(points_cropped[4][0], points_cropped[4][1]);
    flare_masks_hidden_context.closePath();
    flare_masks_hidden_context.fill();
    
    
    let tmp2_direction_horizontal_x = points_cropped[2][0] - points_cropped[5][0];
    let tmp2_direction_horizontal_y = points_cropped[2][1] - points_cropped[5][1];
    
    let tmp2_direction_verticle_x = points_cropped[4][0] - points_cropped[5][0];
    let tmp2_direction_verticle_y = points_cropped[4][1] - points_cropped[5][1];
    
    let person_photo_tmp2_x1 = points_cropped[5][0] + tmp2_direction_horizontal_x * PERSON_PHOTO_X1_RELATIVE + tmp2_direction_verticle_x * PERSON_PHOTO_Y1_RELATIVE;
    let person_photo_tmp2_y1 = points_cropped[5][1] + tmp2_direction_horizontal_y * PERSON_PHOTO_X1_RELATIVE + tmp2_direction_verticle_y * PERSON_PHOTO_Y1_RELATIVE;
    
    let person_photo_tmp2_x2 = points_cropped[5][0] + tmp2_direction_horizontal_x * PERSON_PHOTO_X2_RELATIVE + tmp2_direction_verticle_x * PERSON_PHOTO_Y1_RELATIVE;
    let person_photo_tmp2_y2 = points_cropped[5][1] + tmp2_direction_horizontal_y * PERSON_PHOTO_X2_RELATIVE + tmp2_direction_verticle_y * PERSON_PHOTO_Y1_RELATIVE;
    
    let person_photo_tmp2_x3 = points_cropped[5][0] + tmp2_direction_horizontal_x * PERSON_PHOTO_X2_RELATIVE + tmp2_direction_verticle_x * PERSON_PHOTO_Y2_RELATIVE;
    let person_photo_tmp2_y3 = points_cropped[5][1] + tmp2_direction_horizontal_y * PERSON_PHOTO_X2_RELATIVE + tmp2_direction_verticle_y * PERSON_PHOTO_Y2_RELATIVE;
    
    let person_photo_tmp2_x4 = points_cropped[5][0] + tmp2_direction_horizontal_x * PERSON_PHOTO_X1_RELATIVE + tmp2_direction_verticle_x * PERSON_PHOTO_Y2_RELATIVE;
    let person_photo_tmp2_y4 = points_cropped[5][1] + tmp2_direction_horizontal_y * PERSON_PHOTO_X1_RELATIVE + tmp2_direction_verticle_y * PERSON_PHOTO_Y2_RELATIVE;
    
    flare_masks_hidden_context.fillStyle = CYAN;
    flare_masks_hidden_context.beginPath();
    flare_masks_hidden_context.moveTo(person_photo_tmp2_x1, person_photo_tmp2_y1);
    flare_masks_hidden_context.lineTo(person_photo_tmp2_x2, person_photo_tmp2_y2);
    flare_masks_hidden_context.lineTo(person_photo_tmp2_x3, person_photo_tmp2_y3);
    flare_masks_hidden_context.lineTo(person_photo_tmp2_x4, person_photo_tmp2_y4);
    flare_masks_hidden_context.closePath();
    flare_masks_hidden_context.fill();
    
    
    
    const tf_processing_flare = tf.tidy(() => {
    
        frame_tf = tf.browser.fromPixels(passport_crop_hidden, N_INPUT_CHANNELS_FLARE).toFloat();
        const brightness_amplifiers_tf = tf.tensor([brightness_amplifier_r_tmp, brightness_amplifier_g_tmp, brightness_amplifier_b_tmp], [1, 1, 3]);
        const frame_normailzed_tf = frame_tf.mul(brightness_amplifiers_tf);
        
        masks_tf = tf.browser.fromPixels(flare_masks_hidden, 3).toFloat();
        const normalizator = tf.scalar(255.0);
        const masks_normalized_tf = masks_tf.div(normalizator);
        
        const input_tf = tf.concat([frame_normailzed_tf, masks_normalized_tf], 2);
        const input_batched_tf = input_tf.reshape([1, NET_INPUT_SIZE_Y_FLARE, NET_INPUT_SIZE_X_FLARE, N_INPUT_CHANNELS_ALL_FLARE]);
        //const prediction = net_flare.predict(input_batched_tf).squeeze().clipByValue(0, 1);
        const prediction = net_flare.predict(input_batched_tf).squeeze();
        return prediction;
    });
    let heatmap_data_flare = tf_processing_flare.dataSync();
    //console.log(heatmap_data_flare) // Float32Array(816)
    
    //<canvas id="canvas_flare_tmp" width=24 height=34></canvas>
    //var image_data_uint8_tmp = new Uint8ClampedArray(NET_OUTPUT_SIZE_X_FLARE * NET_OUTPUT_SIZE_Y_FLARE * 4);
    //let pixel_index_4_tmp = 0;
    //for (let pixel_index_tmp = 0; pixel_index_tmp < NET_OUTPUT_SIZE_X_FLARE * NET_OUTPUT_SIZE_Y_FLARE; pixel_index_tmp++){
    //    let pixle_value_tmp = heatmap_data_flare[pixel_index_tmp] * 255.0;
    //    if (pixle_value_tmp > 255.0) {
    //        pixle_value_tmp = 255.0;
    //    }
    //    image_data_uint8_tmp[pixel_index_4_tmp] = pixle_value_tmp;
    //    image_data_uint8_tmp[pixel_index_4_tmp + 1] = image_data_uint8_tmp[pixel_index_4_tmp];
    //    image_data_uint8_tmp[pixel_index_4_tmp + 2] = image_data_uint8_tmp[pixel_index_4_tmp];
    //    image_data_uint8_tmp[pixel_index_4_tmp + 3] = 255;
    //    pixel_index_4_tmp += 4;
    //}
    //var image_data_tmp = new ImageData(image_data_uint8_tmp, NET_OUTPUT_SIZE_X_FLARE, NET_OUTPUT_SIZE_Y_FLARE);
    //canvas_flare_tmp_context.putImageData(image_data_tmp, 0, 0);
    
    
    let flare_brightness = 0.0;
    for (let pixel_index_tmp = 0; pixel_index_tmp < NET_OUTPUT_SIZE_FLARE; pixel_index_tmp++) {
        flare_brightness += heatmap_data_flare[pixel_index_tmp];
    }
    //console.log(flare_brightness);
    
    let flare_detected = false;
    if (flare_brightness >= FLARE_BRIGHTNESS_THRESHOLD) {
        flare_detected = true;
    }
    
    if (flare_detected) {
        return STATUS_FLARE_DETECTED;
    }
    
    
    let success_delay_done = false;
    if (success_frame_no >= START_PHOTO_AT_SUCCESS_FRAME_NO) {
        success_delay_done = true;
    }
    success_frame_no++;
    
    if ( ! success_delay_done) {
        return STATUS_SUCCESS_DELAY_WAITING;
    }
    
    make_photo();
    return STATUS_PHOTO_DONE;
   
}

step_first_run = true;
function step() {
    if (step_first_run) {
        //console.log('step first run');
        step_first_run = false;
    }
    if (streaming) {
        if (currentTimeOld != video.currentTime) {
            if (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2) {
                let isCountFPS = frameIndex % N_FRAMES_FPS_COUNT == 0;
              
                if (isCountFPS) {
                    timeForFPSCount = performance.now();
                }
                
                status_message_no = frame_processing();
                //status(status_message_no);
                slow_changing_status.set(status_message_no);
                
                if (status_message_no != STATUS_SUCCESS_DELAY_WAITING && status_message_no != STATUS_PHOTO_DONE) {
                    success_frame_no = 0;
                }
              
                if (isCountFPS) {
                    let timeDelta = timeForFPSCount - timeForFPSCountOld;
                    let timeDeltaSec = timeDelta / 1000;
                    FPS = N_FRAMES_FPS_COUNT / timeDeltaSec;
                    timeForFPSCountOld = timeForFPSCount;
                    
                    time_predict_mean = time_predict_sum / time_predict_n;
                    time_predict_sum = 0;
                    time_predict_n = 0;
                    
                    FPSElement.innerHTML = "FPS: " + FPS.toString(10) + "  " + time_predict_mean.toString(10);
                    CountFPSIndex++;
                }
              
              
                frameIndex += 1;
            }
        }
        currentTimeOld = video.currentTime;
    }
  
    requestAnimationFrameId = requestAnimationFrame(step);
}

function roundSimple(inp) {
    return Math.floor(inp + 0.5);
}

function roundAdvancedWithMultiplier(inp, multiplier) {
    return Math.floor(inp / multiplier + 0.5) * multiplier;
}

function prepare_global_variables() {
    
    real_settings = stream.getVideoTracks()[0].getSettings();
    //width = real_settings.width;
    //height = real_settings.height;
    //console.log(real_settings);
    width = video.videoWidth;
    height = video.videoHeight;
    //console.log(width);
    //console.log(height);
    video.setAttribute("width", width);
    video.setAttribute("height", height);
    
    if (real_settings.hasOwnProperty("facingMode")) {
        if (real_settings.facingMode == "user") {
            is_mirror = true;
        } else {
            is_mirror = false;
        }
    } else {
        if (is_mobile) {
            is_mirror = false;
        } else {
            is_mirror = true;
        }
    }
        
    let width_display_request = window.innerWidth * WIDTH_DISPLAY_RELATIVE_MAX;
    let height_display_request = window.innerHeight * HEIGHT_DISPLAY_RELATIVE_MAX;
    resize_factor_display = Math.min(width_display_request / width, height_display_request / height);
    width_display = roundSimple(resize_factor_display * width);
    height_display = roundSimple(resize_factor_display * height);
    canvas_display.width = width_display;
    canvas_display.height = height_display;
    
    if (is_mirror) {
        canvas_display.style = "-webkit-transform:scaleX(-1);transform: scaleX(-1)";
    } else {
        //canvas_display.style = "transform: scaleX(1)";
        canvas_display.style = "";
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
    
    slow_changing_status = new SlowChangingStatus(PAUSE_LENGTH_DOWN, PAUSE_LENGTH_UP);
    
    // warm up nets:
    
    const tf_processing_warm_up = tf.tidy(() => {
        const frame_batched_tf = tf.zeros([1, net_input_size_y, net_input_size_x, N_CHANNELS], tf.float32);
        const prediction = net.predict(frame_batched_tf).squeeze().clipByValue(0, 1);
        return tf.unstack(prediction, 2);
    });
    for(let hitmap_index = 0; hitmap_index < PASSPORT_N_POINTS; hitmap_index++) {
        let heatmap_data_warm_up = tf_processing_warm_up[hitmap_index].dataSync();
    }
    
    const tf_processing_flare_warm_up = tf.tidy(() => {
        const input_batched_tf = tf.zeros([1, NET_INPUT_SIZE_Y_FLARE, NET_INPUT_SIZE_X_FLARE, N_INPUT_CHANNELS_ALL_FLARE], tf.float32);
        const prediction = net_flare.predict(input_batched_tf).squeeze().clipByValue(0, 1);
        return prediction;
    });
    let heatmap_data_flare_warm_up = tf_processing_flare_warm_up.dataSync();
    
    //status(5);
    statusElement.innerHTML = 'Загрузка...';
    
}

const mobileDetect = () => {
    let check = false;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        check = true;
    }
    return check;
};

function select_change(event) {
    
    cancelAnimationFrame(requestAnimationFrameId);
    
    streaming = false;
    
    stream.getVideoTracks().forEach(function(track) {
        track.stop();
    });
    //video.srcObject = null;
    //stream = null;
    
    video.pause();
    
    

    let label_index = event.target.value;
    
    
    let camera_id = cameras_ids[label_index];
    
    
    video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, resizeMode: "none", zoom: false, deviceId: { exact: camera_id}};
    
    //if (label_index == 0) {
    //    video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, resizeMode: "none", zoom: false, facingMode: "environment"};
    //} else {
    //    video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, resizeMode: "none", zoom: false, facingMode: "user"};
    //}
    
    camera_constraints = {video: video_constraints, audio: false};
    
    navigator.mediaDevices.getUserMedia(camera_constraints)
        .then(function(s) {
            stream = s;
            for_iphone();
            video.srcObject = s;
            video_play_promise = video.play();
            //requestAnimationFrameId = requestAnimationFrame(step);
        })
        .catch(function(err) {
            console.log("An error occured! " + err);
            //status(7);
            statusElement.innerHTML = 'не удалось запустить видеокамеру';
        });
    
}

function start_camera_rest_code() {
    
    is_camera_selector = false;
    
    real_settings = stream.getVideoTracks()[0].getSettings();
    let already_run_divice_id = null;
    if (real_settings.hasOwnProperty("deviceId")) {
        already_run_divice_id = real_settings.deviceId;
    }
    
    if (cameras_labels.length <= 1 || already_run_divice_id == null) {
        is_camera_selector = false;
    } else {
        is_camera_selector = true;
    }
    
    //// for debug:
    //already_run_divice_id = "not_exist_id";

    //console.log("already_run_divice_id = " + already_run_divice_id.toString())
    //console.log("cameras_labels.length = " + cameras_labels.length.toString(10));
    //console.log("is_camera_selector = " + is_camera_selector.toString());
    
    if (is_camera_selector) {
        if (is_mobile) {
            // define back cameras, sort by MP if possible or invert list:
            let cameras_is_back = [];
            let cameras_mp_values = [];
            let cameras_has_mp_values = [];
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
                cameras_is_back.push(is_back);
                let match = cameras_labels[label_index].match(/\b([0-9]+)\s?MP?\b/i);
                if (match == null) {
                    is_all_mp_values = false;
                    cameras_mp_values.push(0);
                    cameras_has_mp_values.push(false);
                } else {
                    cameras_mp_values.push(parseInt(match[1], 10));
                    cameras_has_mp_values.push(true);
                }
            }
            
            
            //let cameras_labels_back = [];
            //let cameras_ids_back = [];
            //let cameras_mp_values_back = [];
            //let is_all_mp_values_back = true;
            //
            //let cameras_labels_front = [];
            //let cameras_ids_front = [];
            //let cameras_mp_values_front = [];
            //let is_all_mp_values_front = true;
            
            let cameras_labels_grouped = [[], []];
            let cameras_ids_grouped = [[], []];
            let cameras_mp_values_grouped = [[], []];
            let is_all_mp_values_grouped = [true, true];
            
            for (let label_index = 0; label_index < cameras_labels.length; label_index++) {
                let camera_label = cameras_labels[label_index];
                let camera_id = cameras_ids[label_index];
                let camera_mp_value = cameras_mp_values[label_index];
                let is_back = cameras_is_back[label_index];
                let has_mp_value = cameras_has_mp_values[label_index];
                let back_front_index = 0;
                if (is_back) {
                    back_front_index = 0;
                } else {
                    back_front_index = 1;
                }
                
                cameras_labels_grouped[back_front_index].push(camera_label);
                cameras_ids_grouped[back_front_index].push(camera_id);
                cameras_mp_values_grouped[back_front_index].push(camera_mp_value);
                if (!has_mp_value) {
                    is_all_mp_values_grouped[back_front_index] = false;
                }
                
            }
            
            cameras_labels = [];
            cameras_ids = [];
            for (let back_front_index = 0; back_front_index < 2; back_front_index++) {
                if (is_all_mp_values_grouped[back_front_index]) {
                    var indices = new Array(cameras_labels_grouped[back_front_index].length);
                    for (var i = 0; i < indices.length; ++i) indices[i] = i;
                    let values = cameras_mp_values_grouped[back_front_index];
                    indices.sort(function (a, b) { return values[a] < values[b] ? 1 : values[a] > values[b] ? -1 : 0; });
                    cameras_labels_tmp_new = [];
                    cameras_ids_tmp_new = [];
                    for (let index_0 = 0; index_0 < indices.length; index_0++) {
                        let index = indices[index_0];
                        cameras_labels_tmp_new.push(cameras_labels_grouped[back_front_index][index]);
                        cameras_ids_tmp_new.push(cameras_ids_grouped[back_front_index][index]);
                    }
                    cameras_labels_grouped[back_front_index] = cameras_labels_tmp_new;
                    cameras_ids_grouped[back_front_index] = cameras_ids_tmp_new;
                } else {
                    cameras_labels_grouped[back_front_index] = cameras_labels_grouped[back_front_index].reverse();
                    cameras_ids_grouped[back_front_index] = cameras_ids_grouped[back_front_index].reverse();
                }
                for (let label_index = 0; label_index < cameras_labels_grouped[back_front_index].length; label_index++) {
                    cameras_labels.push(cameras_labels_grouped[back_front_index][label_index]);
                    cameras_ids.push(cameras_ids_grouped[back_front_index][label_index]);
                }
            }
                    
            
            
            
            
            //if (is_all_mp_values) {
            //            
            //} else {
            //    cameras_labels = cameras_labels.reverse();
            //    cameras_ids = cameras_ids.reverse();
            //}
            
            if (!START_WITH_ENVIROMENT_CAMERA) {
                cameras_labels = cameras_labels.reverse();
                cameras_ids = cameras_ids.reverse();
            }
            
        }
        
        
        //video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, resizeMode: "none", zoom: false, deviceId: { exact: cameras_ids[0]}};
        
        // https://jsfiddle.net/techiedelight/hw91zuxq/
        select = document.createElement("select");
        //select.width = "30%";
        select.style.width = "50%";
        if (is_mobile) {
            select.style = "font-size: 350%";
        } else {
            select.style = "font-size: 150%";
        }
        select.name = "cameras_select";
        select.id = "cameras_select";
        
        //console.log(cameras_labels);
        for (let label_index = 0; label_index < cameras_labels.length; label_index++) {
            let val = cameras_labels[label_index];
            var option = document.createElement("option");
            option.value = label_index;
            option.text = val;
            select.appendChild(option);
        }
        select.onchange = select_change;
        
        
        
        var label_for_select = document.createElement("label");
        label_for_select.innerHTML = "Выберите камеру: "
        label_for_select.htmlFor = "cameras_select";
        
        var div_for_select = document.createElement("div");
        document.body.insertBefore(div_for_select, FPSElement);
        div_for_select.appendChild(label_for_select).appendChild(select);
        
        if (already_run_divice_id != cameras_ids[0]) {
            streaming = false;
            cancelAnimationFrame(requestAnimationFrameId);
            //console.log("already_run_divice_id != cameras_ids[0]")
            stream.getVideoTracks().forEach(function(track) {
                track.stop();
            });
            //video.srcObject = null;
            video.pause();
            

            let camera_id = cameras_ids[0];
            video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, resizeMode: "none", zoom: false, deviceId: { exact: camera_id}};
            
            camera_constraints = {video: video_constraints, audio: false};
            
            navigator.mediaDevices.getUserMedia(camera_constraints)
                .then(function(s) {
                    stream = s;
                    for_iphone();
                    video.srcObject = s;
                    video_play_promise = video.play();
                    //requestAnimationFrameId = requestAnimationFrame(step);
                })
                .catch(function(err) {
                    console.log("An error occured! " + err);
                    //status(7);
                    statusElement.innerHTML = 'не удалось запустить видеокамеру';
                });
        }

    }
    



    
}

function start_camera() {
    if (streaming) return;
    is_mobile = mobileDetect();
    
    // start with default constrains, to get permision, to run enumerateDevices
    
    if (is_mobile) {
        if (START_WITH_ENVIROMENT_CAMERA) {
            video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, facingMode: "environment", resizeMode: "none", zoom: false};
        } else {
            video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, facingMode: "user", resizeMode: "none", zoom: false};
        }
    } else {
        video_constraints = {width: {ideal: BIG_WIDTH}, height: {ideal: BIG_HEIGHT}, resizeMode: "none", zoom: false};
    }
    
    camera_constraints = {video: video_constraints, audio: false};
    
    var getusermedia_promise = navigator.mediaDevices.getUserMedia(camera_constraints)
        .then(function(s) {
            stream = s;
            for_iphone();
            video.srcObject = s;
            video_play_promise = video.play();
            //requestAnimationFrameId = requestAnimationFrame(step);
        })
        .catch(function(err) {
            console.log("An error occured! " + err);
            //status(7);
            statusElement.innerHTML = 'не удалось запустить видеокамеру';
        });
    
    if (getusermedia_promise == null) {
        //console.log("getusermedia_promise == null");
        //status(7);
        statusElement.innerHTML = 'не удалось запустить видеокамеру';
    } else {
        getusermedia_promise.then(function(s) {
            is_default_constrains = false;
            cameras_labels = [];
            cameras_ids = [];
            
            let devices_enumerated_promise = null;
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.log("enumerateDevices() not supported.");
            } else {
                // https://stackoverflow.com/questions/36453838/assign-the-value-of-mediadevices-enumeratedevices-into-global-variable-in-java
                devices_enumerated_promise = navigator.mediaDevices.enumerateDevices()
                .then(function(devices) {
                    devices.forEach(function(device) {
                    if (device.kind === 'videoinput' && device.label.length > 0) {
                        //console.log(device);
                        cameras_labels.push(device.label);
                        cameras_ids.push(device.deviceId);
                    }
                  });
                  
                  //console.log(cameras_labels)
                  
                })
                .catch(function(err) {
                    console.log(err.name + ": " + err.message);
                });
            }
            
            if (devices_enumerated_promise == null) {
                //console.log("devices_enumerated_promise == null");
                start_camera_rest_code();
            } else {
                //console.log("devices_enumerated_promise != null");
                devices_enumerated_promise.then(function(devices) {
                    //console.log("the promise started");
                    start_camera_rest_code();
                });
            }
            
        });
    
    }
    
    
    
    video.addEventListener("canplay", function(ev){
        if (!streaming) {
            //console.log('streaming = false, canplay');
            // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
            if (video_play_promise !== undefined) {
                video_play_promise.then(_ => {
                    //console.log('video_play_promise started');
                    prepare_global_variables();
                    streaming = true;
                    requestAnimationFrameId = requestAnimationFrame(step);
                })
                .catch(error => {
                    console.log('error with video_play_promise');
                });
            }
            
        }
    }, false);
    
}

const main = async () => {
    net = await tf.loadGraphModel(MODEL_PATH);
    net_flare = await tf.loadGraphModel(MODEL_PATH_FLARE)
    start_camera();
}

//(function () {
//    var old = console.log;
//    var logger = document.getElementById('log');
//    console.log = function (message) {
//        if (typeof message == 'object') {
//            logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
//        } else {
//            logger.innerHTML += message + '<br />';
//        }
//    }
//})();

window.onerror = function(e){
    console.log(e.toString());
}

//main();
 window.onload = main;