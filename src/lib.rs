use std::mem;
use std::os::raw::c_void;
use std::slice;

/* メモリ確保する＆ポインタの位置を返す */
#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut c_void {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf); // 意図的にdrop処理を無効にしてメモリを開放させない
    return ptr as *mut c_void;
}

/* メモリ開放処理 */
#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut c_void, cap: usize) {
    unsafe {
        let _buf = Vec::from_raw_parts(ptr, 0, cap);
    }
}

/* フィルター加工処理 */
// 割り算で小数点以下を扱うため型はfloat
const COLOR_SUM: f32 = 765.0;
const SEPIA_R: f32 = 240.0;
const SEPIA_G: f32 = 200.0;
const SEPIA_B: f32 = 118.0;

#[no_mangle]
pub extern "C" fn filter(pointer: *mut u8, max_width: usize, max_height: usize) {
    let pixel_num = max_width * max_height;
    let byte_size = pixel_num * 4;
    let sl = unsafe { slice::from_raw_parts_mut(pointer, byte_size) };

    for i in 0..pixel_num {
        let r = sl[i * 4] as f32;
        let g = sl[i * 4 + 1] as f32;
        let b = sl[i * 4 + 2] as f32;
        let avg = (r + g + b) / COLOR_SUM;
        sl[i * 4] = (SEPIA_R * avg) as u8; // new r
        sl[i * 4 + 1] = (SEPIA_G * avg) as u8; // new g
        sl[i * 4 + 2] = (SEPIA_B * avg) as u8; // new b

        // 別パターン
        // sl[i*4] = ((r * 0.393) + (g * 0.769) + (b * 0.189)) as u8; // new r
        // sl[i*4+1] = ((r * 0.349) + (g * 0.686) + (b * 0.168)) as u8; // new g
        // sl[i*4+2] = ((r * 0.272) + (g * 0.534) + (b * 0.131)) as u8; // new b
    }
}
