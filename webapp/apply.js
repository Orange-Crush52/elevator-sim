/** Ant Colony Optimization for Elevator Dispatch */
class Brain {
    constructor(p, settings, nAnts, nBest, nIterations, decay, alpha = 0.7, beta = 1.1, tau = 0.1) {
        this.p = p;
        this.settings = settings;
        this.requests;
        this.distances;
        this.pheromones;
        this.nAnts = nAnts;
        this.nBest = nBest;
        this.nIterations = nIterations;
        this.decay = decay;
        this.alpha = alpha; // Pheromone importance
        this.beta = beta; // Distance importance
        this.tau = tau; // Bias towards unexplored paths
        this.globalVisited = new Set(); // Global tracking of visited cities
        this.subSets;
        this.matrix = [[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
            [5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
            [10, 5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
            [15, 10, 5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
            [20, 15, 10, 5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
            [25, 20, 15, 10, 5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
            [30, 25, 20, 15, 10, 5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45],
            [35, 30, 25, 20, 15, 10, 5, 0, 5, 10, 15, 20, 25, 30, 35, 40],
            [40, 35, 30, 25, 20, 15, 10, 5, 0, 5, 10, 15, 20, 25, 30, 35],
            [45, 40, 35, 30, 25, 20, 15, 10, 5, 0, 5, 10, 15, 20, 25, 30],
            [50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0, 5, 10, 15, 20, 25],
            [55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0, 5, 10, 15, 20],
            [60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0, 5, 10, 15],
            [65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0, 5, 10],
            [70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0, 5],
            [75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0]];
        this.carCallQueue = [];
    }
    run(requests, startingPoints) {
        this.requests = requests;
        this.startingPoints = startingPoints;
        let bestSolution = { cost: Infinity, tours: [] };
        this.pheromones = new Array(requests.length).fill(null).map(() => new Array(requests.length).fill(1));
        console.log(this.createSubSets(this.requests, this.startingPoints));
        for (let iteration = 0; iteration < this.nIterations; iteration++) {
            this.globalVisited.clear(); // Reset globalVisited at the start of each iteration
            for (let i = 0; i < this.startingPoints.length; i++) {
                this.globalVisited.add(this.startingPoints[i]);
            }
            let allTours = this.buildSolutions();
            this.updatePheromones(allTours);
            // Evaluate and possibly update the best solution
            let currentSolutionCost = this.evaluateSolution(allTours);
            if (currentSolutionCost < bestSolution.cost) {
                bestSolution = { cost: currentSolutionCost, tours: allTours };
            }
        }
        return bestSolution;
    }
    buildSolutions() {
        let allTours = [];
        for (let antIndex = 0; antIndex < this.nAnts; antIndex++) {
            let tour = this.buildTour(antIndex);
            allTours.push(tour);
        }
        return allTours;
    }
    buildTour(antIndex) {
        let tour = [];
        let startCity = this.startingPoints[antIndex % this.startingPoints.length]; // Ensure index is within bounds
        tour.push(startCity);
        this.globalVisited.add(startCity);
        let currentCity = startCity;
        while (tour.length < this.subSets[antIndex].size) {
            let nextCity = this.selectNextCity(currentCity, this.globalVisited, antIndex);
            if (nextCity === -1)
                break; // No more cities to visit
            tour.push(nextCity);
            this.globalVisited.add(nextCity);
            currentCity = nextCity;
        }
        return tour;
    }
    selectNextCity(currentCity, globalVisited, antIndex) {
        let probabilities = [];
        let denominator = 0;
        for (let i = 0; i < this.requests.length; i++) {
            if (!globalVisited.has(i) && this.subSets[antIndex].has(i)) {
                let pheromoneLevel = Math.pow(this.pheromones[currentCity][i], this.alpha);
                let heuristicValue = Math.pow(1 / (this.matrix[currentCity][i] + this.tau), this.beta);
                let probability = pheromoneLevel * heuristicValue;
                probabilities.push({ city: i, probability });
                denominator += probability;
            }
        }
        if (probabilities.length === 0)
            return -1; // No unvisited cities available
        // Normalize probabilities
        probabilities = probabilities.map(p => ({ city: p.city, probability: p.probability / denominator }));
        // Roulette wheel selection to dynamically choose the next city
        let randomChoice = Math.random();
        let cumulativeProbability = 0;
        for (let prob of probabilities) {
            cumulativeProbability += prob.probability;
            if (randomChoice <= cumulativeProbability) {
                return prob.city;
            }
        }
        return -1; // In case no unvisited city is found
    }
    createSubSets(requests, startingPoints) {
        let subSets = new Array(startingPoints.length);
        for (let i = 0; i < subSets.length; i++) {
            subSets[i] = new Set();
        }
        for (let i = 0; i < requests.length; i++) {
            let differences = startingPoints.map(start => Math.abs(start - requests[i]));
            // let minIndex = differences.reduce((r, v, i, a) => v > a[r] ? r : i, -1)
            let min = Math.min(...differences);
            let minIndexes = this.getAllIndexes(differences, min);
            let minIndex = minIndexes[Math.floor(Math.random() * minIndexes.length)];
            subSets[minIndex].add(requests[i]);
        }
        this.subSets = subSets;
        return this.subSets;
    }
    getAllIndexes(arr, val) {
        var indexes = [], i;
        for (i = 0; i < arr.length; i++)
            if (arr[i] === val)
                indexes.push(i);
        return indexes;
    }
    updatePheromones(allTours) {
        // Evaporate existing pheromones
        for (let i = 0; i < this.pheromones.length; i++) {
            for (let j = 0; j < this.pheromones[i].length; j++) {
                this.pheromones[i][j] *= (1 - this.decay);
            }
        }
        // Strengthen pheromones based on the tours
        allTours.forEach(tour => {
            let cost = this.findCost(tour);
            let additionalPheromone = 1 / cost;
            for (let i = 0; i < tour.length - 1; i++) {
                let from = tour[i];
                let to = tour[i + 1];
                this.pheromones[from][to] += additionalPheromone;
                // If the graph is undirected, update the reverse path as well
                this.pheromones[to][from] += additionalPheromone;
            }
        });
    }
    findCost(tour) {
        // Calculate the total cost of a given tour
        let cost = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            cost += this.matrix[tour[i]][tour[i + 1]];
        }
        return cost;
    }
    evaluateSolution(allTours) {
        // This function sums up the costs of all tours to find the total cost
        let totalCost = allTours.reduce((acc, tour) => acc + this.findCost(tour), 0);
        return totalCost;
    }
    // updateRequests(requests) {
    //     this.requests = requests;
    //     this.pheromones = new Array(requests.length).fill(null).map(() => new Array(requests.length).fill(1))
    // }
    // updateStarting(starting) {
    //     this.startingPoints = starting;
    // }
    generateDistanceMatrix(floors) {
        let uniqueFloors = [...new Set(floors)];
        let distances = [];
        // distances = uniqueFloors.map((floor) => this.matrix[floor-1])
        return distances;
    }
}
class Building {
    constructor(settings, cars) {
        this.settings = settings;
        this.cars = cars;
    }
    // Dont need to mess with this 
    drawFloors(p) {
        p.noStroke();
        p.fill(0, 0, 100, 20);
        for (let floor = 1; floor <= this.settings.numFloors; ++floor) {
            const floorY = p.yFromFloor(floor);
            p.pushed(() => {
                const floorHeight = 4;
                p.translate(p.width / 2, floorY - floorHeight / 2, floor === 1 ? -this.settings.geom.floorDepthOthers / 2 : 0);
                p.box(p.width, floorHeight, floor === 1 ? this.settings.geom.floorDepthGround : this.settings.geom.floorDepthOthers);
            });
            this.cars.forEach(car => {
                p.pushed(() => {
                    const gc = this.settings.geom.car;
                    const indHeight = gc.y / 3;
                    p.translate(car.carCenterX(), floorY + gc.y + indHeight / 2, this.settings.geom.carCenterZ + gc.z / 2);
                    p.noStroke();
                    const carReady = floorY === car.y && (car.state === CarState.Opening || car.state === CarState.Open);
                    if (carReady) {
                        this.drawUpDownIndicator(p, indHeight, car.goingUp);
                    }
                });
            });
        }
    }
    drawUpDownIndicator(p, indHeight, goingUp) {
        p.stroke(125, 84);
        p.fill(255, 248);
        p.plane(14, indHeight);
        p.noStroke();
        p.fill('green');
        goingUp ?
            p.triangle(0, 5, -4, -4, 4, -4) :
            p.triangle(0, -4, -4, 5, 4, 5);
    }
}
var CarState;
(function (CarState) {
    CarState[CarState["Idle"] = 0] = "Idle";
    CarState[CarState["Moving"] = 1] = "Moving";
    CarState[CarState["Opening"] = 2] = "Opening";
    CarState[CarState["Open"] = 3] = "Open";
    CarState[CarState["Closing"] = 4] = "Closing";
})(CarState || (CarState = {}));
class Car {
    constructor(p, settings, stats, carNumber) {
        this.p = p;
        this.settings = settings;
        this.stats = stats;
        this.carNumber = carNumber;
        const gc = settings.geom.car;
        this.doorDims = p.createVector(gc.x / 4, gc.y, 5);
        const interCarSpacing = gc.x;
        this.carHorizontalSpacing = gc.x + interCarSpacing;
        const carsGroupWidth = settings.numCars * gc.x + (settings.numCars - 1) * interCarSpacing;
        const leftRightMargin = settings.geom.canvas.x - carsGroupWidth;
        this.carLeftMargin = leftRightMargin / 2;
        this.y = p.yFromFloor(1);
        this.goingUp = true;
        this.doorOpenFraction = 0; // 0…1 = closed…open
        this.destFloors = [];
        this.riders = [];
        this.pan = settings.numCars === 1 ? 0 : p.map(carNumber, 1, settings.numCars, -0.8, 0.8);
        this.active = false;
        this.state = CarState.Idle;
    }
    draw() {
        this.drawRails();
        this.drawCablesAndCounterweight();
        this.drawCar();
    }
    drawRails() {
        const p = this.p;
        p.noStroke();
        p.fill(128, 16);
        const cd = this.settings.geom.car;
        const halfCarWidth = cd.x / 2;
        const halfCarDepth = cd.z / 2;
        [-halfCarWidth, halfCarWidth].forEach(xOff => {
            [-halfCarDepth, halfCarDepth].forEach(zOff => {
                p.pushed(() => {
                    p.translate(this.carCenterX() + xOff, p.height / 2, this.settings.geom.carCenterZ + zOff);
                    p.box(2, p.height, 1);
                });
            });
        });
    }
    drawCablesAndCounterweight() {
        const p = this.p;
        const geom = this.settings.geom;
        const cg = geom.car;
        const yCarTop = this.y + cg.y;
        const carToCwDist = cg.z * 0.8;
        const cWeightDepth = 5;
        const backOfCarZ = geom.carCenterZ - cg.z / 2;
        const cWeightZ = backOfCarZ - carToCwDist - cWeightDepth / 2;
        const cWeightY = p.height - this.y;
        const cWeightHeight = cg.y / 2;
        const inst = this;
        function drawCounterWeight() {
            p.stroke(220);
            p.noFill();
            p.pushed(() => {
                p.translate(inst.carCenterX(), cWeightY, cWeightZ);
                p.box(cg.x, cWeightHeight, cWeightDepth);
            });
        }
        drawCounterWeight();
        this.drawCables(p, cWeightY + cWeightHeight / 2, p.height, cWeightZ);
        this.drawCables(p, yCarTop, p.height, geom.carCenterZ);
    }
    drawCables(p, yBottom, yTop, cablesZ) {
        p.stroke(180, 32);
        p.noFill();
        const yMiddle = yBottom + (yTop - yBottom) / 2;
        [-3, 0, 3].forEach(xOff => {
            p.pushed(() => {
                p.translate(this.carCenterX() + xOff, yMiddle, cablesZ);
                p.box(1, yTop - yBottom, 1);
            });
        });
    }
    drawCar() {
        const p = this.p;
        p.stroke('silver');
        p.strokeWeight(2);
        p.fill(194, 255 * (this.active ? 0.6 : 0.3));
        p.pushed(() => {
            const gc = this.settings.geom.car;
            p.translate(this.carCenterX(), this.y + gc.y / 2, this.settings.geom.carCenterZ);
            p.box(gc.x, gc.y, gc.z);
            this.drawDoors();
        });
    }
    carCenterX() {
        return this.carLeftMargin + (this.carNumber - 1) * this.carHorizontalSpacing;
    }
    drawDoors() {
        const p = this.p;
        p.strokeWeight(1);
        p.fill(230, 255 * 0.5);
        p.pushed(() => {
            // Bring doors to front of car
            const gc = this.settings.geom.car;
            const dd = this.doorDims;
            p.translate(0, 0, gc.z / 2 - dd.z);
            const doorTravel = gc.x / 4;
            const xDoorDisplacement = gc.x / 8 + doorTravel * this.doorOpenFraction;
            [1, -1].forEach(sign => {
                p.pushed(() => {
                    p.translate(sign * xDoorDisplacement, 0, 0);
                    p.box(dd.x, dd.y, dd.z);
                });
            });
        });
    }
    update() {
        const p = this.p;
        switch (this.state) {
            case CarState.Idle:
                this.idle(p);
                break;
            case CarState.Moving:
                this.move(p);
                break;
            case CarState.Opening:
                this.doorOpenFraction = p.constrain((this.nowSecs() - this.doorOpStarted) / this.settings.doorMovementSecs, 0, 1);
                if (this.doorOpenFraction === 1) {
                    this.state = CarState.Open;
                    this.openSince = p.millis();
                }
                break;
            case CarState.Open:
                const timeToClose = this.openSince + this.settings.doorOpenMs;
                const timeToWait = timeToClose - p.millis();
                if (timeToWait <= 0) {
                    this.state = CarState.Closing;
                    this.doorOpStarted = this.nowSecs();
                }
                break;
            case CarState.Closing:
                this.doorOpenFraction = 1 - p.constrain((this.nowSecs() - this.doorOpStarted) / this.settings.doorMovementSecs, 0, 1);
                if (this.doorOpenFraction === 0) {
                    this.state = CarState.Idle;
                }
                break;
        }
    }
    nowSecs() {
        return this.p.millis() / 1000;
    }
    idle(p) {
        if (this.settings.controlMode === 0) {
            if (this.destFloors.length) {
                let nextDest = this.destFloors.find(f => this.goingUp ? p.yFromFloor(f) > this.y : p.yFromFloor(f) < this.y);
                if (!nextDest) {
                    this.goingUp = !this.goingUp;
                    this.sortDestinations();
                    nextDest = this.destFloors[0];
                }
                this.stats.addMovementCosts(Math.abs(p.floorFromY(this.y) - nextDest), this.settings.elevSpeed);
                this.state = CarState.Moving;
                // console.log(`Car ${this.carNumber} moving to ${nextDest} of ${this.destFloors}!!!!!!!!!`);
                this.lastMoveTime = p.millis() / 1000;
                this.speed = 0;
                this.maxMaxSpeed = 1000;
                this.maxSpeed = p.map(this.settings.elevSpeed, 1, 10, 20, this.maxMaxSpeed);
                this.accel = this.maxSpeed * 2;
                this.startY = this.y;
                this.endY = p.yFromFloor(nextDest);
                this.absTrip = Math.abs(this.startY - this.endY);
                this.accelDistance = Math.min(this.absTrip / 2, (this.maxSpeed * this.maxSpeed) / (2 * this.accel));
            }
        }
        else if (this.settings.controlMode === 2) {
        }
    }
    move(p) {
        const absTraveled = Math.abs(this.y - this.startY);
        const absTravelLeft = Math.abs(this.endY - this.y);
        const now = p.millis() / 1000;
        const ΔtSinceLastMove = now - this.lastMoveTime;
        this.lastMoveTime = now;
        if (this.accelerating()) {
            this.speed = Math.max(1, Math.sqrt(2 * this.accel * absTraveled));
        }
        else if (this.decelerating()) {
            this.speed = Math.sqrt(2 * this.accel * absTravelLeft);
        }
        const ΔySinceLastMove = Math.min(absTravelLeft, this.speed * ΔtSinceLastMove);
        const direction = this.goingUp ? 1 : -1;
        this.y += direction * ΔySinceLastMove;
        const absTravelLeftAfterMove = Math.abs(this.endY - this.y);
        if (absTravelLeftAfterMove < 1) {
            this.y = this.endY;
            this.doorOpStarted = this.nowSecs();
            this.state = CarState.Opening;
            this.removeCurrentFloorFromDest();
            if (this.y === p.yFromFloor(1))
                this.goingUp = true;
            if (this.y === p.yFromFloor(this.settings.numFloors))
                this.goingUp = false;
        }
    }
    addRider(rider) {
        this.riders.push(rider);
    }
    removeRider(rider) {
        this.riders = this.riders.filter(r => r !== rider);
    }
    hasRoom() {
        return this.riders.length < this.settings.maxRidersPerCar;
    }
    decelerating() {
        return Math.abs(this.y - this.endY) < this.accelDistance && this.speed > 0;
    }
    accelerating() {
        return Math.abs(this.y - this.startY) < this.accelDistance && this.speed < this.maxSpeed;
    }
    removeCurrentFloorFromDest() {
        this.destFloors = this.destFloors.filter(f => this.p.yFromFloor(f) !== this.y);
    }
    goTo(floor, manual = false) {
        if (manual || this.settings.controlMode === 0 /* Auto */) {
            if (!this.destFloors.find(f => f === floor)) {
                this.destFloors.push(floor);
                this.sortDestinations();
                // console.log(`Car ${this.carNumber} will be going gog ogo go to ${floor}`);
            }
        }
    }
    sortDestinations() {
        this.destFloors.sort((a, b) => this.goingUp ? a - b : b - a);
    }
}
class Controls {
    constructor(p, settings, stats) {
        this.p = p;
        this.settings = settings;
        this.stats = stats;
        this.activeCarsChange = () => { };
    }
    createKnobs(passengerLoadTypes, passengerTrafficTypes) {
        const p = this.p;
        const settings = this.settings;
        const elevSpeed = p.select('#elevSpeed');
        elevSpeed.value(settings.elevSpeed);
        elevSpeed.changed(() => settings.elevSpeed = elevSpeed.value());
        const numCars = p.select('#numActiveCars');
        numCars.value(settings.numActiveCars);
        numCars.changed(() => {
            settings.numActiveCars = numCars.value();
            this.activeCarsChange();
        });
        const projection = 'Orthographic';
        // const projection = p.createSelect();
        // ['Orthographic'].forEach(p => projection.option(p));
        // projection.parent('#projectionParent');
        // projection.changed(() => settings.projectionType = projection.elt.selectedIndex);
        const controlMode = p.createSelect();
        ['Auto', 'Manual', 'Smart'].forEach(p => controlMode.option(p));
        controlMode.parent('#controlModeParent');
        controlMode.changed(() => settings.controlMode = controlMode.elt.selectedIndex);
        console.log(controlMode);
        const view = p.createSelect();
        ['Front', 'Side', 'Use Mouse'].forEach(v => view.option(v));
        view.parent('#viewParent');
        view.changed(() => settings.view = view.elt.selectedIndex);
        const passengerLoad = p.createSelect();
        passengerLoadTypes.forEach(o => passengerLoad.option(o));
        passengerLoad.parent('#passengerLoadParent');
        passengerLoad.changed(() => settings.passengerLoad = passengerLoad.elt.selectedIndex);
        const passengerTraffic = p.createSelect();
        passengerTrafficTypes.forEach(o => passengerTraffic.option(o));
        passengerTraffic.parent('#passengerTrafficTypesParent');
        passengerTraffic.changed(() => settings.passengerTraffic = passengerTraffic.elt.selectedIndex);
        this.paymentsChart = p.createGraphics(this.stats.maxRecentRiderPayments, 15).parent('#paymentsChart');
        $('#paymentsChart canvas').show();
        // this.waitChart = p.createGraphics(this.stats.maxRecentRiderPayments,
        //     45).parent('#waitChart');
        // $('#waitChart canvas').show();
    }
}
/** Manages riders, and calls elevators for them. */
class Dispatcher {
    constructor(p, settings, cars, stats) {
        this.p = p;
        this.settings = settings;
        this.cars = cars;
        this.stats = stats;
        // this.brain = brain;
        this.carCallQueue = [];
        this.riders = [];
        this.brain = new Brain(this.p, this.settings, this.settings.numCars, 2, 100, 0.5);
    }
    requestCar(floor, goingUp) {
        if (!this.carCallQueue.find(request => request.floor === floor && request.goingUp === goingUp)) {
            this.carCallQueue.push({ floor: floor, goingUp: goingUp });
        }
    }
    process() {
        this.processRiders();
        if (this.settings.controlMode === 0 /* Auto */) {
            const request = this.carCallQueue.shift();
            if (request) {
                // just uses closest non busy elevator (Standard Elevator Algorithm)
                // Weird bug where elevators get stuck on top floor
                const floorY = this.p.yFromFloor(request.floor);
                const activeCars = this.activeCars();
                const idleCars = activeCars.filter(car => car.state === CarState.Idle && car.goingUp === request.goingUp);
                const dist = car => Math.abs(car.y - floorY);
                const closest = cars => cars.reduce((a, b) => a && b ? dist(a) > dist(b) ? b : a : b, undefined);
                const closestIdleActiveCar = closest(idleCars);
                if (closestIdleActiveCar) {
                    closestIdleActiveCar.goTo(request.floor);
                }
                else {
                    const closestActiveCar = closest(activeCars);
                    if (closestActiveCar)
                        closestActiveCar.goTo(request.floor);
                    else
                        this.carCallQueue.push(request);
                }
            }
        }
        else if (this.settings.controlMode === 2) {
            const requests = [...this.carCallQueue];
            if (JSON.stringify(requests) === JSON.stringify(this.pastRequests)) {
                return;
            }
            this.pastRequests = requests;
            let starting = this.cars.map((car) => car.y / 60);
            if (requests.length > 0) {
                let floors = [];
                for (let i = 0; i < requests.length; i++) {
                    floors.push(requests[i].floor);
                }
                // console.log(floors)
                console.log("Best Solution:", this.brain.run(floors, starting));
            }
        }
    }
    /** Returns an array of active cars, selected from the middle of the group, moving outward */
    activeCars() {
        if (this.settings.numActiveCars !== this.numActiveCarsInCache) {
            const carIndexes = [...Array(this.settings.numCars).keys()];
            const middleIndex = carIndexes[Math.floor(carIndexes.length / 2)];
            const distFromMiddle = i => Math.abs(i - middleIndex);
            carIndexes.sort((a, b) => distFromMiddle(a) - distFromMiddle(b));
            const activeCarIndexes = carIndexes.slice(0, this.settings.numActiveCars);
            this.cachedActiveCars = Array.from(activeCarIndexes, i => this.cars[i]);
            this.numActiveCarsInCache = this.settings.numActiveCars;
        }
        return this.cachedActiveCars;
    }
    isActive(car) {
        return this.activeCars().find(c => c === car) !== undefined;
    }
    updateCarActiveStatuses() {
        this.cars.forEach(car => car.active = this.isActive(car));
    }
    processRiders() {
        this.riders.forEach(rider => {
            rider.update();
            rider.draw();
        });
        this.riders = this.riders.filter(rider => rider.state !== RiderState.Exited);
        this.possiblySpawnNewRider();
    }
    possiblySpawnNewRider() {
        const p = this.p;
        // const randomFloor = () => p.random(1) < 0.5 ? 1 : Math.floor(p.random(this.settings.numFloors) + 1);
        const randomFloor = () => Math.floor(p.random(this.settings.numFloors) + 1);
        const load = this.settings.passengerLoad;
        // load right here this is where to change !!!!!!!!!!!!!!!!!!!!
        const desiredPerMin = load === 0 ? // Varying
            p.map(p.sin(p.millis() / 1e5), -1, 1, 10, 60) :
            Math.pow(5, load - 1);
        const desiredPerSec = desiredPerMin / 60;
        const spawnChance = Math.min(1, desiredPerSec / p.frameRate());
        if (this.settings.passengerTraffic === 0) {
            if (p.random(1) < spawnChance) {
                const start = randomFloor();
                let end = randomFloor();
                while (start === end) {
                    end = randomFloor();
                }
                this.riders.push(new Rider(p, this.settings, start, end, this, this.stats));
            }
        }
        else if (this.settings.passengerTraffic === 1) {
            if (p.random(1) < spawnChance) {
                const start = 1;
                let end = randomFloor();
                while (start === end) {
                    end = randomFloor();
                }
                this.riders.push(new Rider(p, this.settings, start, end, this, this.stats));
            }
        }
        else if (this.settings.passengerTraffic === 2) {
            if (p.random(1) < spawnChance) {
                const start = randomFloor();
                let end = 1;
                while (start === end) {
                    end = randomFloor();
                }
                this.riders.push(new Rider(p, this.settings, start, end, this, this.stats));
            }
        }
    }
}
/** Manages an elevator rider */
var RiderState;
(function (RiderState) {
    RiderState[RiderState["Arriving"] = 0] = "Arriving";
    RiderState[RiderState["Waiting"] = 1] = "Waiting";
    RiderState[RiderState["Boarding"] = 2] = "Boarding";
    RiderState[RiderState["Riding"] = 3] = "Riding";
    RiderState[RiderState["Exiting"] = 4] = "Exiting";
    RiderState[RiderState["Exited"] = 5] = "Exited";
})(RiderState || (RiderState = {}));
class Rider {
    constructor(p, settings, startFloor, destFloor, dispatcher, stats) {
        this.p = p;
        this.settings = settings;
        this.startFloor = startFloor;
        this.destFloor = destFloor;
        this.dispatcher = dispatcher;
        this.stats = stats;
        this.state = RiderState.Arriving;
        this.arrivalTime = p.millis() / 1000;
        this.carGeom = settings.geom.car;
        this.setBodyAttributes();
        const travelDirection = p.random([-1, 1]);
        const enterX = p.width / 2 - travelDirection * p.width / 2;
        this.pos = p.createVector(enterX, p.yFromFloor(startFloor), this.randomFloorZ());
        const waitX = enterX + travelDirection * p.randomGaussian(p.width / 3, p.width / 4);
        this.arrivingPath = [p.createVector(waitX, this.pos.y, this.pos.z)];
        this.carIn = undefined;
        this.color = [p.random(255), p.random(255), p.random(255)];
        this.movementPerMs = p.randomGaussian(300, 50) / 1000;
        this.destNumberDisplay = this.setUpDestNumberDisplay(p);
        ++stats.riders.waiting;
    }
    setBodyAttributes() {
        const p = this.p;
        const meanHeight = 1.7;
        const meanWeight = 85;
        this.height = p.constrain(p.randomGaussian(meanHeight, 0.5), 1, 2.2);
        this.weight = p.constrain(p.randomGaussian(meanWeight, 10), 30, 150);
        const bmi = this.weight / (this.height * this.height);
        const bmiDiffLimit = 10;
        const normalBmiDiff = p.constrain(bmi - 25, -bmiDiffLimit, bmiDiffLimit);
        const widthMultiple = p.map(normalBmiDiff, -bmiDiffLimit, bmiDiffLimit, 0.7, 2.1);
        const normalWaistDiam = .90 / Math.PI; // d = circumference / π
        this.width = normalWaistDiam * widthMultiple;
    }
    randomFloorZ() {
        return this.p.lerp(-20, 20, this.p.random(1));
    }
    update() {
        const p = this.p;
        switch (this.state) {
            case RiderState.Arriving:
                this.followPath(this.arrivingPath, RiderState.Waiting, () => {
                    this.requestCar();
                });
                break;
            case RiderState.Waiting:
                this.waitForCar();
                break;
            case RiderState.Boarding:
                const canceled = this.followPath(this.boardingPath, RiderState.Riding, () => {
                    --this.stats.riders.waiting;
                    ++this.stats.riders.riding;
                    this.stats.riders.ridingKg += this.weight;
                }, () => this.carIn.state === CarState.Open);
                if (canceled) {
                    this.carIn.removeRider(this);
                    this.carIn = undefined;
                    this.requestCar();
                    this.state = RiderState.Waiting;
                }
                break;
            case RiderState.Riding:
                this.ride();
                break;
            case RiderState.Exiting:
                this.followPath(this.exitingPath, RiderState.Exited, () => {
                    const tripTime = p.millis() / 1000 - this.arrivalTime;
                    this.stats.chargeRider(p, tripTime);
                });
                break;
        }
    }
    requestCar() {
        this.dispatcher.requestCar(this.startFloor, this.destFloor > this.startFloor);
    }
    waitForCar() {
        const goingUp = this.destFloor > this.startFloor;
        const yThisFloor = this.p.yFromFloor(this.startFloor);
        let suitableExceptFullEncountered = false;
        const suitableCar = this.dispatcher.activeCars().find(car => {
            const allButRoom = car.state === CarState.Open && car.y === yThisFloor &&
                (this.settings.controlMode === 1 || car.goingUp === goingUp);
            if (allButRoom && !car.hasRoom())
                suitableExceptFullEncountered = true;
            return allButRoom && car.hasRoom();
        });
        if (suitableCar) {
            this.carIn = suitableCar;
            this.carIn.addRider(this);
            this.carIn.goTo(this.destFloor);
            this.setBoardingPath(suitableCar);
            this.millisAtLastMove = this.p.millis();
            // Time is from when the enter the elevator bay to when they board the elevator
            const waitTime = this.p.millis() / 1000 - this.arrivalTime;
            this.stats.collectTimes(waitTime);
            this.state = RiderState.Boarding;
        }
    }
    outsideDoorPos(openCar) {
        return this.p.createVector(openCar.carCenterX() + this.fuzz(2), this.pos.y, openCar.settings.geom.carCenterZ + this.carGeom.z + this.fuzz(2));
    }
    ride() {
        const car = this.carIn;
        this.pos.y = car.y;
        if (car.state === CarState.Open && car.y === this.p.yFromFloor(this.destFloor)) {
            car.removeRider(this);
            this.setExitingPath(car);
            this.millisAtLastMove = this.p.millis();
            --this.stats.riders.riding;
            this.stats.riders.ridingKg -= this.weight;
            ++this.stats.riders.served;
            this.state = RiderState.Exiting;
        }
    }
    setBoardingPath(car) {
        const cg = this.carGeom;
        const insideCar = this.p.createVector(car.carCenterX() + this.fuzz(cg.x * 0.4), this.pos.y, car.settings.geom.carCenterZ + this.fuzz(cg.z * 0.4));
        this.boardingPath = [this.outsideDoorPos(car), insideCar];
    }
    setExitingPath(car) {
        const p = this.p;
        const nearDoorInsideCar = p.createVector(car.carCenterX() + this.fuzz(2), this.pos.y, car.settings.geom.carCenterZ + this.carGeom.z / 2 - 5 + this.fuzz(2));
        const outsideDoor = this.outsideDoorPos(car);
        const exitPoint = p.createVector(p.width / 2 - this.p.random([-1, 1]) * p.width / 2, this.pos.y, this.randomFloorZ());
        this.exitingPath = [nearDoorInsideCar, outsideDoor, exitPoint];
    }
    fuzz(half) {
        return this.p.map(this.p.random(1), 0, 1, -half, half);
    }
    followPath(path, nextState, onComplete, continueWhile) {
        if (continueWhile && !continueWhile())
            return true;
        const distanceToDestination = this.moveToward(path[0]);
        if (distanceToDestination === 0) {
            path.shift();
            if (!path.length) {
                this.state = nextState;
                if (onComplete)
                    onComplete();
            }
        }
    }
    moveToward(dest) {
        const now = this.p.millis();
        const millisSinceLastStep = now - (this.millisAtLastMove || now);
        this.millisAtLastMove = now;
        const pointerToDest = p5.Vector.sub(dest, this.pos);
        const distToDest = pointerToDest.mag();
        const stepMagnitude = Math.min(distToDest, this.movementPerMs * millisSinceLastStep);
        const step = p5.Vector.mult(pointerToDest.normalize(), stepMagnitude);
        this.pos.add(step);
        return p5.Vector.sub(dest, this.pos).mag();
    }
    draw() {
        if (this.state === RiderState.Exited)
            return;
        const p = this.p;
        const s = x => x * this.settings.geom.scaleMetersTo3dUnits;
        const legLength = s(this.height / 3);
        const height = s(this.height) - legLength;
        const width = s(this.width);
        p.pushed(() => {
            p.translate(this.pos.x, this.pos.y, this.pos.z);
            p.pushed(() => {
                p.translate(0, legLength + height / 2, 0);
                p.noStroke();
                p.fill(this.color[0], this.color[1], this.color[2]);
                p.ellipsoid(width / 2, height / 2, this.width / 2);
            });
            p.pushed(() => {
                p.translate(0, legLength + height + s(0.5), 0);
                p.scale(0.5, -0.5, 1); // Fix upside-down and shrink for better quality
                p.texture(this.destNumberDisplay);
                p.noStroke();
                p.plane(25);
            });
        });
    }
    setUpDestNumberDisplay(p) {
        const pg = p.createGraphics(25, 25);
        pg.stroke(100);
        pg.fill(100);
        pg.textFont('sans-serif', 24);
        pg.textAlign(p.CENTER);
        pg.text(this.destFloor, 12, 25);
        return pg;
    }
}
new p5(p => {
    const passengerLoadTypes = ['Varying', 'Very Light', 'Light', 'Moderate', 'Heavy', 'Very Heavy', 'Insane'];
    const passengerTrafficTypes = ['Meeting', 'Up', 'Down'];
    function createSettings() {
        const car = p.createVector(1, 1, 1.3).mult(50);
        const floorDepthOthers = 50;
        return {
            numCars: 8,
            doorMovementSecs: 0.4,
            doorOpenMs: 2500,
            maxRidersPerCar: 25,
            numActiveCars: 0,
            geom: {
                scaleMetersTo3dUnits: 16, // Some objects are defined with metric dimensions
                car: car,
                carCenterZ: -car.z / 2 - floorDepthOthers / 2,
                storyHeight: car.y * 1.2,
                floorDepthGround: floorDepthOthers * 2,
                floorDepthOthers: floorDepthOthers,
                canvas: undefined
            },
            controlMode: 0, // Auto
            elevSpeed: 5,
            view: 0,
            passengerLoad: 0,
            passengerLoadNumManualLevels: passengerLoadTypes.length - 1, // The first is not manual
            numFloors: undefined, // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            passengerTraffic: 0
        };
    }
    const settings = createSettings();
    let mouseHasMoved = false;
    p.yFromFloor = floor => settings.geom.storyHeight * (floor - 1);
    p.floorFromY = y => Math.round(y / settings.geom.storyHeight + 1);
    let controls;
    let cars;
    let building;
    let stats;
    let dispatcher;
    // let talker;
    let ready = false;
    p.setup = function () {
        const cg = settings.geom;
        setCanvasSize();
        p.createCanvas(cg.canvas.x, cg.canvas.y, p.WEBGL).parent('main');
        settings.numFloors = Math.floor(p.height / settings.geom.storyHeight);
        stats = new Stats();
        controls = new Controls(p, settings, stats);
        // talker = new Talker(settings);
        // talker.whenLoaded(() => {
        // might want to make a new when loaded
        cars = Array.from(Array(settings.numCars).keys(), n => new Car(p, settings, stats, n + 1));
        building = new Building(settings, cars);
        dispatcher = new Dispatcher(p, settings, cars, stats);
        controls.createKnobs(passengerLoadTypes, passengerTrafficTypes);
        controls.activeCarsChange = () => dispatcher.updateCarActiveStatuses();
        ready = true;
        // });
    };
    function setCanvasSize() {
        const m = $('#main');
        settings.geom.canvas = p.createVector(m.width() * 0.95, p.windowHeight * 0.92); // todo Remove these magic numbers
    }
    p.windowResized = function () {
        setCanvasSize();
        p.resizeCanvas(settings.geom.canvas.x, settings.geom.canvas.y);
    };
    p.mouseMoved = function () {
        mouseHasMoved = true;
    };
    function manuallySummon() {
        if (settings.controlMode === 1 && p.mouseX >= 0 && p.mouseY >= 0) {
            const dist = car => Math.abs(car.carCenterX() - p.mouseX);
            const car = dispatcher.activeCars().reduce((a, b) => a && b ? dist(a) > dist(b) ? b : a : b, undefined);
            if (car) {
                const y = p.height - p.mouseY;
                car.goTo(p.floorFromY(y), true);
            }
        }
    }
    p.mousePressed = function () {
        manuallySummon();
    };
    p.mouseDragged = function () {
        manuallySummon();
    };
    p.pushed = function (block) {
        p.push();
        block();
        p.pop();
    };
    function rotateOnY() {
        let rotY = 0;
        if (settings.view === 1)
            rotY = -p.TAU / 4;
        else if (settings.view === 2 && mouseHasMoved)
            rotY = p.map(p.mouseX, 0, p.width, -p.TAU / 8, p.TAU / 8);
        p.rotateY(rotY);
    }
    function showRiderStats() {
        const s = stats.riders;
        // add wait times to stats.riders
        const l = s => s.toLocaleString();
        const now = p.millis() / 1000;
        const waitingRiders = dispatcher.riders.filter(r => r.state === RiderState.Waiting);
        const waitSecs = waitingRiders.reduce((accum, rider) => (now - rider.arrivalTime) + accum, 0);
        const wait = s.waiting ? ` (${l(Math.round(waitSecs))} secs)` : '';
        const profit = s.payments - stats.costs.operating;
        $('#score').html(l(Math.round(Math.max(0, profit / (p.millis() / 1000 / 60)))));
        $('#waiting').html(`${l(s.waiting)}${wait}`);
        const w = stats.waitTimes;
        const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
        $('#waitTime').html(l(average(w)));
        const weight = s.riding ? ` (${l(s.ridingKg / 1000)} Mg)` : '';
        $('#riding').html(`${l(s.riding)}${weight}`);
        $('#served').html(l(s.served));
        const curStyle = { style: 'currency', currency: 'usd' };
        $('#payments').html(s.payments.toLocaleString('en-us', curStyle));
        $('#costs').html(stats.costs.operating.toLocaleString('en-us', curStyle));
        $('#profit').html((profit).toLocaleString('en-us', curStyle));
        const g = controls.paymentsChart;
        const yScale = g.height / stats.normalRideCost;
        stats.recentRiderPayments.forEach((a, i) => {
            const rideCost = a * yScale;
            g.stroke('white');
            g.line(i, 0, i, g.height);
            g.stroke('gray');
            g.line(i, g.height - rideCost, i, g.height);
        });
        // const cg = controls.waitChart;
        // const spacing = cg.width/w.length;
        // let px = 0;
        // let py = w[0];
        // cg.clear();
        // w.forEach((time, index) => {
        //     cg.line(px, py, index*spacing, time);
        //     px= index*spacing;
        //     py = time;
        // })
    }
    function setUpCamera() {
        p.ortho();
        // setDefault();
    }
    let lastDrawTimeSecs = p.millis() / 1000;
    p.draw = function () {
        if (!ready)
            return;
        const now = (p.millis() / 1000);
        const timeSinceLastDrawSecs = now - lastDrawTimeSecs;
        lastDrawTimeSecs = now;
        stats.addIdleCosts(timeSinceLastDrawSecs, settings.numActiveCars);
        showRiderStats();
        p.background(240);
        setUpCamera();
        rotateOnY();
        inQuadrant1(() => {
            cars.forEach(car => {
                car.update();
                car.draw();
            });
            building.drawFloors(p);
            dispatcher.process();
        });
    };
    /** Places the origin at the bottom left, and makes y increase going up. */
    function inQuadrant1(block) {
        p.push();
        p.translate(-p.width / 2, p.height / 2, 0);
        p.scale(1, -1, 1);
        block();
        p.pop();
    }
});
class Stats {
    constructor() {
        this.riders = {
            riding: 0,
            ridingKg: 0,
            waiting: 0,
            served: 0,
            payments: 0,
        };
        this.costs = {
            perSec: 0.01,
            perSecPerCar: 0.01,
            perFloor: 0.1,
            operating: 0
        };
        this.normalRideCost = 0.25;
        this.maxRecentRiderPayments = 150;
        this.recentRiderPayments = [];
        this.recentTripTimes = [];
        this.waitTimes = [];
    }
    chargeRider(p, tripTime) {
        const penaltyTime = p.constrain(tripTime - 30, 0, 300);
        const rideCost = this.normalRideCost - p.map(penaltyTime, 0, 300, 0, this.normalRideCost);
        this.recentRiderPayments.push(rideCost);
        this.recentTripTimes.push(tripTime);
        if (this.recentRiderPayments.length > this.maxRecentRiderPayments) {
            this.recentRiderPayments.shift();
            this.recentTripTimes.shift();
        }
        this.riders.payments += rideCost;
    }
    collectTimes(waitTime) {
        this.waitTimes.push(waitTime);
    }
    addMovementCosts(numFloors, speed) {
        this.costs.operating += this.costs.perFloor * (1 + speed / 10) * numFloors;
    }
    addIdleCosts(secs, numActiveCars) {
        this.costs.operating += this.costs.perSec * secs;
        this.costs.operating += this.costs.perSecPerCar * secs * numActiveCars;
    }
}
//# sourceMappingURL=apply.js.map