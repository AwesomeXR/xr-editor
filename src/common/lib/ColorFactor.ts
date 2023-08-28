export class ColorFactory {
  static create(size: number) {
    return (i: number) => {
      const h = ((360 / size) * i) % 360;
      return `hsla(${h}deg, 100%, 50%)`;
    };
  }
}
