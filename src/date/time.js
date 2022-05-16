
KaToolsV1.time = class {

    constructor(hour, minute, seconds) {
        this.hour = parseInt(hour);
        this.minute = parseInt(typeof minute === "undefined" ? ß : minute)
        this.seconds = parseInt(typeof seconds === "undefined" ? 0 : seconds)
    }


    static create(timeString) {
        let hour, minute, seconds;
        [hour, minute, seconds] = timeString.split(":");
        return new this(hour, minute, seconds);
    }

    toString(format="H:i:s") {
        return format
            .replace("H", this.hour.toString().padStart(2,0))
            .replace("i", this.minute.toString().padStart(2,0))
            .replace("s", this.seconds.toString().padStart(2,0))

    }
}
