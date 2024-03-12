/*

Betmig’s snooker app is a dynamic digital interpretation of traditional snooker, enriched with extended features like a
dynamic cue system and sound effects, which elevate the standard gameplay experience. This application is tailored to
attract a broad audience through its engaging gameplay mechanics and various modes.

Extensions: Dynamic Cue System and Sound Effects

     - Dynamic Cue System: This extension revolutionizes player interaction. The cue's angle
     and power dynamically respond to mouse movements, allowing players to simulate realistic 
     snooker shots. This feature introduces a new level of strategy and skill, enhancing the 
     traditional browser snooker game.

     - Sound Effects: As an additional extension, sound effects are integrated to create a more
      immersive environment. These effects, activated during specific actions like ball collisions
      and pocketing, add auditory depth to the gameplay, bringing the virtual snooker experience
      closer to reality.

Game Modes

      - Regular Snooker Setup: Emulates the classic snooker game, perfect for traditionalists seeking
       the authentic snooker experience.
      - Red Balls Only: Simplifies the game by focusing solely on potting red balls, making it
        ideal for beginners or quick play.
      - Colored and Red Balls: Introduces a mix of colored and red balls for a more challenging 
        and varied gameplay experience.
      - Hidden Game Mode: Accessible by pressing the key '4', this hidden mode provides a 
        unique twist to the game, offering players an unexpected and novel snooker experience.

Technical and User Experience

The game logic needed to be sophisticated enough to handle various scenarios and outcomes based on the rules of snooker.
This included managing turns, enforcing rules for fouls, and keeping track of the score.
The implementation of the dynamic cue system and sound effects required a deep understanding of the physics involved in
the game as well as technical proficiency in programming interactive elements in P5.js and Matter.js.

Conclusion
Overall, this snooker game app differentiates itself with its extended features of a dynamic cue system and integrated
sound effects, which together enhance the realism and engagement of the game. Coupled with multiple game modes,
including a hidden feature, the app caters to a diverse range of players, from beginners to seasoned snooker
enthusiasts. The app's blend of realistic gameplay, educational elements, and user-friendly design makes it
an attractive and comprehensive digital snooker experience.

*/

// Global variables and P5js and matter.js setup
let world,
  pockets = [],
  balls = [],
  engine;
let currentMode = 1,
  score = 0,
  cueBall,
  numberOfBalls = 15;
let soundBuffers = [],
  currentSoundIndex = 0,
  NUM_SOUNDS = 3,
  playSoundFlag = false;

let cue,
  cueAngle = 180,
  cueWidth = 5,
  cueHeight = 150;
let cueIndependentX = 300,
  cueIndependentY = 150,
  isDraggingCue = false;
let cueIndependentAngle = 0,
  cuePower = 0,
  maxCuePower = 5,
  isCueActive = false;

let tableWidth = 600,
  tableHeight = tableWidth / 2;
let lastPocketedBall = 0,
  lastTwoPocketedBalls = [],
  cueBallOriginalPosition;
let ballDiameter = tableWidth / 60,
  originalPositionsMap = {},
  isRedTurn = true;
let numberOfRedBalls = 15,
  redBallsRemaining = numberOfRedBalls;
let coloredOrder = [
  "#FFFF00",
  "#008000",
  "#964B00",
  "#0000FF",
  "#FFC0CB",
  "#000000",
];
let currentColorIndex = 0,
  alertMessages = [];

function preload() {
  // extension
  for (let i = 0; i < NUM_SOUNDS; i++) {
    loadSound("poolballhit.mp3", (sound) => {
      soundBuffers[i] = sound;
    });
  }
}

function setup() {
  let canvasWidth = 798;
  let canvasHeight = 400;

  // Initialize global table dimensions
  tableWidth = canvasWidth;
  tableHeight = canvasWidth / 2; // Maintain the 2:1 ratio for the snooker table

  frameWidth = 10;

  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("snooker-table");

  let ballDiameter = tableWidth / 60;
  let pocketDiameter = ballDiameter * 1.5;
  initialBallPositions = createTriangleFormation(
    tableWidth,
    tableHeight,
    ballDiameter,
    numberOfBalls
  );

  drawTable(tableWidth, tableHeight);

  drawPockets(pocketDiameter);

  // Create Matter.js engine and world
  engine = Matter.Engine.create();
  world = engine.world; // Initialize 'world' using the global variable

  Matter.Events.on(engine, "collisionStart", handleCollision);

  // Disable gravity for top-down view
  engine.world.gravity.y = 0;
  engine.world.gravity.x = 0;

  createWalls();

  // Add a mousePressed event listener to resume audio context (extension)
  canvas.mousePressed(userStartAudio);

  // This function resumes the audio context (extension)
  function userStartAudio() {
    if (getAudioContext().state !== "running") {
      getAudioContext().resume();
    }
  }

  // Create balls using the global 'initialBallPositions' array
  for (let i = 0; i < initialBallPositions.length; i++) {
    let position = initialBallPositions[i];
    let redBallProperties = snookerBalls[2];
    let snookerBall = createBall(
      position.x,
      position.y,
      ballDiameter / 2,
      redBallProperties
    );
    Matter.World.add(world, snookerBall);
    balls.push(snookerBall);
  }

  // Define properties for colored balls
  let greenBallProperties = snookerBalls.find(
    (ball) => ball.color === "#008000"
  );
  let brownBallProperties = snookerBalls.find(
    (ball) => ball.color === "#964B00"
  );
  let yellowBallProperties = snookerBalls.find(
    (ball) => ball.color === "#FFFF00"
  );
  let blueBallProperties = snookerBalls.find(
    (ball) => ball.color === "#0000FF"
  );
  let pinkBallProperties = snookerBalls.find(
    (ball) => ball.color === "#FFC0CB"
  );
  let blackBallProperties = snookerBalls.find(
    (ball) => ball.color === "#000000"
  );

  // Calculate positions for colored balls
  let ballsY = dCenterY + 20; // 20 pixels below the baulk line
  let blueBallX = tableWidth / 2; // Center of the table width
  let blueBallY = tableHeight / 2; // Center of the table height
  let pinkBallX = initialBallPositions[0].x - ballDiameter; // Left of the first red ball
  let pinkBallY = initialBallPositions[0].y;
  let blackBallX = tableWidth - frameWidth * 4;
  let blackBallY = tableHeight / 2; // Vertically centered

  // Store the original positions of the colored balls
  originalPositionsMap[greenBallProperties.color] = {
    x: dCenterX,
    y: ballsY - 70,
  };
  originalPositionsMap[brownBallProperties.color] = {
    x: dCenterX,
    y: ballsY - 18,
  };
  originalPositionsMap[yellowBallProperties.color] = {
    x: dCenterX,
    y: ballsY + 30,
  };
  originalPositionsMap[blueBallProperties.color] = {
    x: blueBallX,
    y: blueBallY,
  };
  originalPositionsMap[pinkBallProperties.color] = {
    x: pinkBallX,
    y: pinkBallY,
  };
  originalPositionsMap[blackBallProperties.color] = {
    x: blackBallX,
    y: blackBallY,
  };

  // Create and add colored balls
  let coloredBalls = [
    { props: greenBallProperties, x: dCenterX, y: ballsY - 70 },
    { props: brownBallProperties, x: dCenterX, y: ballsY - 18 },
    { props: yellowBallProperties, x: dCenterX, y: ballsY + 30 },
    { props: blueBallProperties, x: blueBallX, y: blueBallY },
    { props: pinkBallProperties, x: pinkBallX, y: pinkBallY },
    { props: blackBallProperties, x: blackBallX, y: blackBallY },
  ];

  coloredBalls.forEach((ball) => {
    let newBall = createBall(ball.x, ball.y, ballDiameter / 2, ball.props);
    Matter.World.add(world, newBall);
    balls.push(newBall);
  });

  // Create the cue as a rectangle
  // Place the cue behind the "D" zone
  let cueInitialX = dCenterX - 100;
  let cueInitialY = dCenterY;
  cue = Matter.Bodies.rectangle(cueInitialX, cueInitialY, cueWidth, cueHeight, {
    isStatic: true,
  });

  // Add the cue to the world
  Matter.World.add(world, cue);

  createPocketsAsSensors(world); // Pass the global 'world' variable

  setupCollisionHandling(engine);

  let runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);
}

function placeCueBall() {
  let cueBallRadius = tableWidth / 100;
  let newCueBall = createCueBall(mouseX, mouseY, cueBallRadius);
  Matter.World.add(world, newCueBall);
  cueBall = newCueBall; // Set the new cue ball
  balls.push(newCueBall);
}

// Update the content of the "score" div with the initial score value
document.getElementById("score").textContent = "Score: " + score;

// Update the existing updateScore function
function updateScore(newScore) {
  if (!isNaN(newScore) && typeof newScore === "number") {
    score = newScore;
    document.getElementById("score").textContent = "Score: " + score;
  } else {
    console.error(
      "Attempted to update score with a non-numeric value",
      newScore
    );
  }
}

function updateScoreForPocketedBall(ball) {
  if (typeof ball.ballValue === "number") {
    console.log("Ball Value Before Updating Score:", ball.ballValue);
    score += ball.ballValue;
    updateScore(score);
  } else {
    console.error("Invalid ball value encountered:", ball.ballValue);
  }
}

function createWalls() {
  let wallThickness = 20;
  let wallColor = "#FF0000";
  let options = {
    isStatic: true,
    render: { visible: true, fillStyle: wallColor },
  }; // Make visible for debugging

  // Create walls with adjusted positions and sizes
  let topWall = Matter.Bodies.rectangle(
    tableWidth / 2,
    frameWidth + wallThickness / 2,
    tableWidth - 2 * frameWidth,
    wallThickness,
    options
  );
  let bottomWall = Matter.Bodies.rectangle(
    tableWidth / 2,
    tableHeight - frameWidth - wallThickness / 2,
    tableWidth - 2 * frameWidth,
    wallThickness,
    options
  );
  let leftWall = Matter.Bodies.rectangle(
    frameWidth + wallThickness / 4,
    tableHeight / 2,
    wallThickness,
    tableHeight - 2 * frameWidth,
    options
  );
  let rightWall = Matter.Bodies.rectangle(
    tableWidth - frameWidth - wallThickness / 2,
    tableHeight / 2,
    wallThickness,
    tableHeight - 2 * frameWidth,
    options
  );

  // Add walls to the world
  Matter.World.add(world, [topWall, bottomWall, leftWall, rightWall]);
}

function createCueBall(x, y, radius) {
  return Matter.Bodies.circle(x, y, radius, {
    restitution: 0.9, // Bounciness
    friction: 0.05,
    density: 0.1,
    label: "cueBall",
    ballValue: 0,
    render: {
      fillStyle: "white", // Color of the cue ball
    },
  });
}

function createTriangleFormation(
  tableWidth,
  tableHeight,
  ballDiameter,
  numBalls
) {
  let positions = [];
  let spacing = ballDiameter * 1.05; // Tighter spacing between balls

  // Keep the same center positions as before
  let centerX = tableWidth * 0.7;
  let centerY = tableHeight / 2;

  let rowLength = Math.floor((Math.sqrt(8 * numBalls + 1) - 1) / 2); // Calculate rowLength based on the triangular number formula

  for (let row = 0; row <= rowLength; row++) {
    for (let col = 0; col <= row; col++) {
      let x = centerX + (row * spacing * Math.sqrt(3)) / 2;
      let y = centerY + (col - row / 2) * spacing;
      positions.push({ x: x, y: y });
    }
  }

  return positions;
}

function createPocketsAsSensors(world) {
  let frameWidth = 20;
  let pocketRadius = tableWidth / 66;
  let pocketSize = pocketRadius * 1.8;

  let pocketPositions = [
    { x: frameWidth + pocketRadius, y: frameWidth + pocketRadius }, // Top-left
    { x: tableWidth - frameWidth - pocketRadius, y: frameWidth + pocketRadius }, // Top-right
    {
      x: frameWidth + pocketRadius,
      y: tableHeight - frameWidth - pocketRadius,
    }, // Bottom-left
    {
      x: tableWidth - frameWidth - pocketRadius,
      y: tableHeight - frameWidth - pocketRadius,
    }, // Bottom-right
    { x: tableWidth / 2, y: frameWidth + pocketRadius }, // Middle-top
    { x: tableWidth / 2, y: tableHeight - frameWidth - pocketRadius }, // Middle-bottom
  ];

  // Create sensor pockets
  for (let pos of pocketPositions) {
    let pocket = Matter.Bodies.circle(pos.x, pos.y, pocketSize, {
      isSensor: true,
      label: "pocket",
    });

    Matter.World.add(world, pocket);
    pockets.push(pocket);
  }
}

function drawTable(tableWidth, tableHeight) {
  // Set the wooden frame properties
  let frameWidth = 25;
  let cornerRadius = frameWidth;

  // Draw the wooden frame with rounded corners
  noStroke();
  fill(99, 70, 53);
  rect(0, 0, tableWidth, tableHeight, cornerRadius);
  fill(58, 99, 61);
  rect(
    frameWidth,
    frameWidth,
    tableWidth - 2 * frameWidth,
    tableHeight - 2 * frameWidth
  ); // Inner rectangle for the green baize

  // Set the properties for the "D"
  dRadius = tableWidth / 10; // The diameter of the "D" semicircle
  dCenterX = tableWidth * 0.25; // The "D" center x-position
  dCenterY = tableHeight / 2; // The "D" center y-position
}

// Snooker ball colors and values
let snookerBalls = [
  { color: "#FFFFFF", value: -4 }, // White (cue ball)
  { color: "#FFFF00", value: 2 }, // Yellow
  { color: "#FF0000", value: 1 }, // Red
  { color: "#008000", value: 3 }, // Green
  { color: "#0000FF", value: 5 }, // Blue
  { color: "#964B00", value: 4 }, // Brown
  { color: "#FFC0CB", value: 6 }, // Pink
  { color: "#000000", value: 7 }, // Black
];

function createBall(x, y, radius, ball) {
  let newBall = Matter.Bodies.circle(x, y, radius, {
    restitution: 0.9, // Bounciness
    friction: 0.05,
    render: {
      fillStyle: ball.color,
    },
    label: "snookerBall",
    ballValue: ball.value, // Store the point value of the ball
  });
  return newBall;
}

function drawPockets(tableWidth, tableHeight, pocketDiameter) {
  let frameWidth = 20;
  let pocketRadius = pocketDiameter / 2;

  fill(46, 38, 34);
  stroke(64, 50, 41);
  strokeWeight(1);

  // Adjust positions to be within the frame
  // Corner pockets
  ellipse(
    frameWidth + pocketRadius,
    frameWidth + pocketRadius,
    pocketDiameter,
    pocketDiameter
  ); // Top-left
  ellipse(
    tableWidth - frameWidth - pocketRadius,
    frameWidth + pocketRadius,
    pocketDiameter,
    pocketDiameter
  ); // Top-right
  ellipse(
    frameWidth + pocketRadius,
    tableHeight - frameWidth - pocketRadius,
    pocketDiameter,
    pocketDiameter
  ); // Bottom-left
  ellipse(
    tableWidth - frameWidth - pocketRadius,
    tableHeight - frameWidth - pocketRadius,
    pocketDiameter,
    pocketDiameter
  ); // Bottom-right

  // Side pockets need to be adjusted to be vertically centered within the playing area
  ellipse(
    tableWidth / 2,
    frameWidth + pocketRadius,
    pocketDiameter,
    pocketDiameter
  ); // Middle-top
  ellipse(
    tableWidth / 2,
    tableHeight - frameWidth - pocketRadius,
    pocketDiameter,
    pocketDiameter
  ); // Middle-bottom
}

function getOriginalPosition(ball) {
  // Check if the ball's color is in the map
  if (originalPositionsMap[ball.render.fillStyle]) {
    return originalPositionsMap[ball.render.fillStyle];
  }
  console.error("Original position not found for ball", ball);
  return { x: 0, y: 0 }; // Fallback position
}

function drawCue() {
  if (cue && cueBall && isCueActive) {
    push();
    let cueAngle;

    if (isDraggingCue) {
      // Calculate the angle from the mouse to the cue ball and add 45 degrees
      cueAngle =
        atan2(cueBall.position.y - mouseY, cueBall.position.x - mouseX) + PI;

      // Set the base of the cue at the mouse cursor
      translate(mouseX, mouseY);
    } else {
      // Calculate the angle from the cue ball to the mouse
      cueAngle =
        atan2(cueBall.position.y - mouseY, cueBall.position.x - mouseX) +
        PI +
        300;

      // Set the base of the cue at the cue ball
      translate(cueBall.position.x, cueBall.position.y);
    }

    rotate(cueAngle);

    // Draw the cue
    fill(41, 38, 36); // Brown color for wood
    noStroke();
    rectMode(CENTER);
    rect(0, -cueHeight / 1.6, cueWidth, cueHeight);
    pop();
  }
}

function draw() {
  background(255);

  // Draw table
  drawTable(tableWidth, tableHeight);

  // Draw the baulk line
  strokeWeight(2);
  stroke(255);
  let startX = dCenterX;
  let endX = dCenterX;
  let startY = frameWidth + 20;
  let endY = tableHeight - frameWidth - 20;

  // Draw the modified line
  line(startX, startY, endX, endY);

  // Draw the "D" as an arc
  noFill(); // No fill for the "D"
  arc(dCenterX, dCenterY, dRadius * 2, dRadius * 2, HALF_PI, 3 * HALF_PI);

  drawPockets(tableWidth, tableHeight, tableWidth / 24);

  renderBalls();

  drawCue();

  // Check if the sound should be played (extension)
  if (playSoundFlag && getAudioContext().state === "running") {
    soundBuffers[currentSoundIndex].play();
    currentSoundIndex = (currentSoundIndex + 1) % NUM_SOUNDS;
    playSoundFlag = false; // Reset the flag
  }
}

function renderBalls() {
  balls.forEach((ball) => {
    if (ball) {
      // Only render the cue ball if it hasn't been pocketed
      if (ball === cueBall && cueBall === null) {
        return; // Skip rendering the cue ball if it's been pocketed
      }
      stroke(255, 255, 255, 80);
      strokeWeight(2);
      // Draw the ball
      fill(ball.render.fillStyle);
      ellipse(
        ball.position.x,
        ball.position.y,
        ball.circleRadius * 2,
        ball.circleRadius * 2
      );

      // Add enhanced shading for a 3D effect
      let lightAngle = PI / 1.5; // Angle of the light source
      let shadingColor = color(255, 255, 255, 70);
      fill(shadingColor);
      arc(
        ball.position.x,
        ball.position.y,
        ball.circleRadius * 2,
        ball.circleRadius * 2,
        lightAngle - PI,
        lightAngle
      );
    }
  });
}

function playSound() {
  // Extension
  if (getAudioContext().state === "running") {
    soundBuffers[currentSoundIndex].play();
    currentSoundIndex = (currentSoundIndex + 1) % NUM_SOUNDS;
  }
}

function handleCollision(event) {
  let pairs = event.pairs;

  for (let pair of pairs) {
    // Check for a collision between the cue ball and another snooker ball
    if (
      (pair.bodyA.label === "cueBall" && pair.bodyB.label === "snookerBall") ||
      (pair.bodyB.label === "cueBall" && pair.bodyA.label === "snookerBall")
    ) {
      playSoundFlag = true;
    }

    if (pair.bodyA.label === "pocket" || pair.bodyB.label === "pocket") {
      let ball = pair.bodyA.label === "snookerBall" ? pair.bodyA : pair.bodyB;

      // Handle cue ball pocketing separately
      if (ball === cueBall) {
        handleCueBallPocketing();
      } else if (ball.label === "snookerBall") {
        handleOtherBallPocketing(ball);
      }
    }
  }
}

function handleCueBallPocketing() {
  // Remove the cue ball and decrease the score
  Matter.World.remove(world, cueBall);
  score--;
  cueBall = null; // Set cueBall to null indicating it's not in the world
  updateScore(score);

  // Display the alert message
  displayAlert(
    "❌ Foul: 🤦🏾‍♂️ Uh-oh! Cue ball's pocketed, pal. That's a cheeky -1. Tap to retry!"
  );
}

function removeFromGame(ball) {
  Matter.World.remove(world, ball);
  balls = balls.filter((b) => b !== ball);
}

function updateScoreForPocketedBall(ball) {
  if (typeof ball.ballValue === "number") {
    score += ball.ballValue;
    updateScore(score);
  }
}

function updateScore(newScore) {
  document.getElementById("score").textContent = "Score: " + newScore;
}

function setupCollisionHandling(engine) {
  Matter.Events.on(engine, "collisionStart", function (event) {
    let pairs = event.pairs;

    for (let pair of pairs) {
      if (isPocketCollision(pair)) {
        let ball = pair.bodyA.label === "snookerBall" ? pair.bodyA : pair.bodyB;

        if (ball === cueBall) {
          // Temporarily remove the cue ball
          Matter.World.remove(world, cueBall);

          // Decrease score
          score--;

          // Set a timeout to re-add the cue ball in the "D" zone
          setTimeout(function () {
            let cueBallX = dCenterX; // Center of the "D"
            let cueBallY = dCenterY + dRadius - tableWidth / 60 - 5; // Position inside the "D"
            cueBall = createCueBall(cueBallX, cueBallY, tableWidth / 60);
            Matter.World.add(world, cueBall);
          }, 500);
        } else {
          // Increase score and remove other ball
          if (
            ball.ballValue !== undefined &&
            typeof ball.ballValue === "number"
          ) {
            score += ball.ballValue;
            updateScore(score);
          }
          Matter.World.remove(world, ball);
          balls = balls.filter((b) => b !== ball);
        }
      }
    }
  });
}

function isPocketCollision(pair) {
  let isPocket = pockets.includes(pair.bodyA) || pockets.includes(pair.bodyB);
  let isBall = balls.includes(pair.bodyA) || balls.includes(pair.bodyB);
  return isPocket && isBall;
}

function mousePressed() {
  if (!cueBall) {
    // Place a new cue ball if there isn't one
    placeCueBall();
  } else if (
    dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y) <
    cueBall.circleRadius
  ) {
    // Existing functionality for dragging and charging the cue
    isCueActive = true;
    cueChargeStart = millis();
  }
}

// Ensure the simulateCueAction function applies force when mouse is released and cue is charged
function mouseReleased() {
  if (isCueActive) {
    let releaseAngle = atan2(
      mouseY - cueBall.position.y,
      mouseX - cueBall.position.x
    );

    let forceScaleFactor = 0.0003; // Reduced scale factor
    let maxAllowedForce = 0.5; // Maximum allowed force
    let forceMagnitude = min(
      (millis() - cueChargeStart) * forceScaleFactor,
      maxCuePower,
      maxAllowedForce
    );

    let forceX = cos(releaseAngle) * forceMagnitude;
    let forceY = sin(releaseAngle) * forceMagnitude;

    Matter.Body.applyForce(
      cueBall,
      { x: cueBall.position.x, y: cueBall.position.y },
      { x: forceX, y: forceY }
    );

    isCueActive = false;
  }
}

function switchToMode(newMode) {
  // Clear existing balls and reset game state
  clearBalls();
  resetGameState();

  // Switch to the new mode
  currentMode = newMode;

  // Initialize the new mode
  initializeMode(newMode);
}

function keyPressed() {
  if (key === "1") {
    switchToMode(1);
  } else if (key === "2") {
    switchToMode(2);
  } else if (key === "3") {
    switchToMode(3);
  } else if (key === "4") {
    switchToMode(4);
  }
}

function clearBalls() {
  // Remove all balls from the world
  balls.forEach((ball) => {
    Matter.World.remove(world, ball);
  });
  balls = [];
  // Ensure the cue ball is also cleared
  if (cueBall) {
    Matter.World.remove(world, cueBall);
    cueBall = null;
  }
}

function resetGameState() {
  // Reset score and other relevant variables
  score = 0;
  redBallsRemaining = numberOfRedBalls;
  currentColorIndex = 0;
  updateScore(score);
}

function initializeMode(mode) {
  switch (mode) {
    case 1:
      setupDefaultMode();
      break;
    case 2:
      randomRedsOnlyMode();
      break;
    case 3:
      randomRedsAndColouredMode();
      break;
    case 4:
      setupColoredBallsMode();
      break;
  }
}

function setupDefaultMode() {
  clearBalls(); // Clear any existing balls

  // Create and position balls as in the original setup
  let ballDiameter = tableWidth / 60;
  let initialBallPositions = createTriangleFormation(
    tableWidth,
    tableHeight,
    ballDiameter,
    numberOfBalls
  );
  let ballsY = dCenterY + 20;

  // Add red balls
  for (let i = 0; i < initialBallPositions.length; i++) {
    let position = initialBallPositions[i];
    let redBallProperties = snookerBalls[2];
    let snookerBall = createBall(
      position.x,
      position.y,
      ballDiameter / 2,
      redBallProperties
    );
    Matter.World.add(world, snookerBall);
    balls.push(snookerBall);
  }

  // Add colored balls
  let greenBallProperties = snookerBalls.find(
    (ball) => ball.color === "#008000"
  ); // Replace with correct color code if different
  let brownBallProperties = snookerBalls.find(
    (ball) => ball.color === "#964B00"
  ); // Replace with correct color code if different
  let yellowBallProperties = snookerBalls.find(
    (ball) => ball.color === "#FFFF00"
  ); // Replace with correct color code if different

  // Create and add green, brown, and yellow balls
  let greenBall = createBall(
    dCenterX,
    ballsY - 70,
    ballDiameter / 2,
    greenBallProperties
  );
  let brownBall = createBall(
    dCenterX,
    ballsY - 18,
    ballDiameter / 2,
    brownBallProperties
  );
  let yellowBall = createBall(
    dCenterX,
    ballsY + 30,
    ballDiameter / 2,
    yellowBallProperties
  );

  Matter.World.add(world, [greenBall, brownBall, yellowBall]);
  balls.push(greenBall, brownBall, yellowBall);

  // Create and add the blue ball
  let blueBallProperties = snookerBalls.find(
    (ball) => ball.color === "#0000FF"
  ); // Find blue ball properties
  let blueBallX = tableWidth / 2;
  let blueBallY = tableHeight / 2;

  let blueBall = createBall(
    blueBallX,
    blueBallY,
    ballDiameter / 2,
    blueBallProperties
  );
  Matter.World.add(world, blueBall);
  balls.push(blueBall);

  // Calculate position for the pink ball
  let pinkBallX = initialBallPositions[0].x - ballDiameter;
  let pinkBallY = initialBallPositions[0].y;

  // Create and add the pink ball
  let pinkBallProperties = snookerBalls.find(
    (ball) => ball.color === "#FFC0CB"
  );
  let pinkBall = createBall(
    pinkBallX,
    pinkBallY,
    ballDiameter / 2,
    pinkBallProperties
  );
  Matter.World.add(world, pinkBall);
  balls.push(pinkBall);

  // Calculate position for the black ball
  let blackBallX = tableWidth - frameWidth * 4;
  let blackBallY = tableHeight / 2;

  // Create and add the black ball
  let blackBallProperties = snookerBalls.find(
    (ball) => ball.color === "#000000"
  );
  let blackBall = createBall(
    blackBallX,
    blackBallY,
    ballDiameter / 2,
    blackBallProperties
  );
  Matter.World.add(world, blackBall);
  balls.push(blackBall);
}

function handleOtherBallPocketing(ball) {
  // Update score and remove the ball from the game
  updateScoreForPocketedBall(ball);
  removeFromGame(ball);

  // Store the last pocketed ball that is not a cue ball
  lastPocketedBall = ball;
  if (ball.label === "snookerBall" && ball !== cueBall) {
    let ballColor = ball.render.fillStyle;

    // Handling for Mode 4: Colored Balls Only Mode
    if (currentMode === 4) {
      if (ballColor === coloredOrder[currentColorIndex]) {
        score += ball.ballValue;
        updateNextExpectedColor();
        removeFromGame(ball);
      } else {
        let nextColorName = getColorName(coloredOrder[currentColorIndex]);
        displayAlert(
          `❌ Foul: 🤦🏽‍♂️ Oi, blimey! Ya should've sunk the ${nextColorName} ball, ya muppet!`
        );
        updateScore(score - 4);
        removeFromGame(ball);
      }
    }

    // Handling red balls
    if (ballColor === "#FF0000") {
      score += ball.ballValue;
      redBallsRemaining--;
      removeFromGame(ball);
    }
    // Handling colored balls
    else {
      // If red balls are still remaining
      if (redBallsRemaining > 0) {
        displayAlert(
          `❌ Foul: Blimey! 🤦🏽‍♂️ You've nipped a coloured ball out of turn!`
        );
        updateScore(score - 4);
        returnColoredBall(ball);
      }
      // Handling colored balls after all reds are potted
      else {
        // Correct order in Mode 3 (after all reds are potted)
        if (ballColor === coloredOrder[currentColorIndex]) {
          score += ball.ballValue;
          updateNextExpectedColor();
          removeFromGame(ball);
        } else {
          let nextColorName = getColorName(coloredOrder[currentColorIndex]);
          displayAlert(
            `❌ Foul: 🤦🏽‍♂️ Oi, blimey! Ya should've sunk the ${nextColorName} ball, ya muppet!`
          );
          updateScore(score - 4);
          returnColoredBall(ball);
        }
      }
    }

    updateScore(score);
  }
}

function returnColoredBall(ball) {
  let originalPos = getOriginalPosition(ball);
  setTimeout(() => {
    let newBall = createBall(originalPos.x, originalPos.y, ball.circleRadius, {
      color: ball.render.fillStyle,
      value: ball.ballValue,
    });
    Matter.World.add(world, newBall);
    balls.push(newBall);
  }, 500);
}

function updateNextExpectedColor() {
  currentColorIndex = (currentColorIndex + 1) % coloredOrder.length;
}

function getColorName(colorCode) {
  switch (colorCode) {
    case "#FFFF00":
      return "yellow";
    case "#008000":
      return "green";
    case "#964B00":
      return "brown";
    case "#0000FF":
      return "blue";
    case "#FFC0CB":
      return "pink";
    case "#000000":
      return "black";
    default:
      return "unknown color";
  }
}

// Update the content of the "score" div with the initial score value
document.getElementById("score").textContent = "⚜️ Score: " + score + " ⚜️ ";

// Update the existing updateScore function
function updateScore(newScore) {
  if (!isNaN(newScore) && typeof newScore === "number") {
    score = newScore;
    document.getElementById("score").textContent =
      "⚜️ Score: " + score + " ⚜️ ";
  } else {
    console.error(
      "Attempted to update score with a non-numeric value",
      newScore
    );
  }
}

function randomRedsOnlyMode() {
  clearBalls(); // Clear existing balls

  // Define the cushion thickness and pocket buffer
  let cushionThickness = 20;
  let pocketBuffer = (tableWidth / 60) * 1.5;

  // Define larger safe areas for ball placement
  let safeAreaMinX = cushionThickness + pocketBuffer;
  let safeAreaMaxX = tableWidth - cushionThickness - pocketBuffer;
  let safeAreaMinY = cushionThickness + pocketBuffer;
  let safeAreaMaxY = tableHeight - cushionThickness - pocketBuffer;

  // Function to create and add red balls
  function addRedBall() {
    let x = random(safeAreaMinX, safeAreaMaxX);
    let y = random(safeAreaMinY, safeAreaMaxY);
    let redBallProperties = snookerBalls.find(
      (ball) => ball.color === "#FF0000"
    );
    let redBall = createBall(x, y, tableWidth / 60 / 2, redBallProperties);
    Matter.World.add(world, redBall);
    balls.push(redBall);
  }

  // Add red balls within the safe zones
  for (let i = 0; i < numberOfBalls; i++) {
    addRedBall();
  }
}

function randomRedsAndColouredMode() {
  clearBalls();

  // Define the cushion thickness and increase pocket buffer
  let cushionThickness = 20;
  let pocketBuffer = (tableWidth / 60) * 1.5;

  // Define larger safe areas for ball placement
  let safeAreaMinX = cushionThickness + pocketBuffer;
  let safeAreaMaxX = tableWidth - cushionThickness - pocketBuffer;
  let safeAreaMinY = cushionThickness + pocketBuffer;
  let safeAreaMaxY = tableHeight - cushionThickness - pocketBuffer;

  // Function to create and add balls
  function addBall(color, properties) {
    let x = random(safeAreaMinX, safeAreaMaxX);
    let y = random(safeAreaMinY, safeAreaMaxY);
    let newBall = createBall(x, y, tableWidth / 60 / 2, properties);
    Matter.World.add(world, newBall);
    balls.push(newBall);
  }

  // Add colored balls (excluding white and red)
  let coloredBalls = snookerBalls.filter(
    (ball) => ball.color !== "#FFFFFF" && ball.color !== "#FF0000"
  );
  coloredBalls.forEach((ball) => addBall(ball.color, ball));

  // Fill the remaining slots with red balls
  let remainingSlots = numberOfBalls - coloredBalls.length;
  for (let i = 0; i < remainingSlots; i++) {
    let redBallProperties = snookerBalls.find(
      (ball) => ball.color === "#FF0000"
    );
    addBall("#FF0000", redBallProperties);
  }
}

function setupColoredBallsMode() {
  clearBalls();

  // Place colored balls in their original positions
  coloredOrder.forEach((color) => {
    let coloredBallProperties = snookerBalls.find(
      (ball) => ball.color === color
    );
    let originalPos = originalPositionsMap[color]; // Use the predefined positions for colored balls
    let coloredBall = createBall(
      originalPos.x,
      originalPos.y,
      ballDiameter / 2,
      coloredBallProperties
    );
    Matter.World.add(world, coloredBall);
    balls.push(coloredBall);
  });
}

const MAX_MESSAGES = 4; // Maximum number of messages to display

function displayAlert(message) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMessage = `<strong>${timestamp}</strong>: ${message}`;
  alertMessages.push(formattedMessage);

  if (alertMessages.length > MAX_MESSAGES) {
    alertMessages.shift();
  }

  updateAlertsDisplay();
  setTimeout(() => {
    alertMessages = alertMessages.filter((msg) => msg !== formattedMessage);
    updateAlertsDisplay();
  }, 30000);
}

function updateAlertsDisplay() {
  const alertsDiv = document.getElementById("alerts");
  const messagesToDisplay = alertMessages.slice(-MAX_MESSAGES);
  alertsDiv.innerHTML = messagesToDisplay.join("<br>");
}

