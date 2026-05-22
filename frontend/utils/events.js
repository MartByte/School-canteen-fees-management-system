class EventEmitter {
    constructor() {
      this.listeners = {};
    }
  
    addListener(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
      return {
        remove: () => {
          this.listeners[event] = this.listeners[event].filter(l => l !== callback);
        }
      };
    }
  
    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => callback(data));
      }
    }
  }
  
  const eventStack = new EventEmitter();
  export default eventStack;