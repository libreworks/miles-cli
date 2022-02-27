const ora = require("ora");

const pauseSpinnerDuring = (callback) => {
  spinner.clear();
  try {
    callback();
  } finally {
    spinner.render();
  }
};

const spinner = ora({ text: "Loading the thing", spinner: "dots2" }).start();

const interval2 = setInterval(() => {
  pauseSpinnerDuring(() => {
    console.error("Hey", new Date());
  });
}, 75);

setTimeout(() => {
  clearInterval(interval2);
  spinner.succeed();
  process.exit(0);
}, 10000);
