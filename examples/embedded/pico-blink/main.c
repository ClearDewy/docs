#include "pico/stdlib.h"

// 原版 Pico 的板载 LED 为 GP25，高电平点亮。GP15 镜像输出供测量。
// 首次实验不接外部负载；GP15 不是板上第 15 号物理焊盘。
#define MEASURE_PIN 15u
#define HALF_PERIOD_MS 500u

int main(void) {
    gpio_init(PICO_DEFAULT_LED_PIN);
    gpio_set_dir(PICO_DEFAULT_LED_PIN, GPIO_OUT);
    gpio_init(MEASURE_PIN);
    gpio_set_dir(MEASURE_PIN, GPIO_OUT);
    while (true) {
        gpio_put(PICO_DEFAULT_LED_PIN, 1);
        gpio_put(MEASURE_PIN, 1);
        sleep_ms(HALF_PERIOD_MS);
        gpio_put(PICO_DEFAULT_LED_PIN, 0);
        gpio_put(MEASURE_PIN, 0);
        sleep_ms(HALF_PERIOD_MS);
    }
}
