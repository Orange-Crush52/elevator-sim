/** Ant Colony Optimization for Elevator Dispatch */
class Brain {
    private readonly p: any;
    private readonly settings: any;
    private readonly activeIndex: any;
    private requests: any[];
    private readonly stats: any;
    private carCallQueue: any[];

    private distances: any[];
    private pheromones: any[];
    private nAnts: any;
    private nIterations : any;
    private nBest: any;
    private decay: any;
    private alpha: any;
    private beta: any;
    private tau: any;
    private startingPoints: any[];
    private globalVisited: any;
    private subSets: any[];

    private matrix: any[];


    constructor(p, settings, nAnts, nBest, nIterations, decay, alpha=0.7, beta=1.1, tau=0.1) {
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
        this.matrix =  [[0,  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
        [5,  0,  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
        [10,  5,  0,  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
        [15, 10,  5,  0,  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
        [20, 15, 10,  5,  0,  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
        [25, 20, 15, 10,  5,  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
        [30, 25, 20, 15, 10,  5, 0,  5, 10, 15, 20, 25, 30, 35, 40, 45],
        [35, 30, 25, 20, 15, 10, 5,  0,  5, 10, 15, 20, 25, 30, 35, 40],
        [40, 35, 30, 25, 20, 15, 10,  5,  0,  5, 10, 15, 20, 25, 30, 35],
        [45, 40, 35, 30, 25, 20, 15, 10,  5,  0,  5, 10, 15, 20, 25, 30],
        [50, 45, 40, 35, 30, 25, 20, 15, 10,  5,  0,  5, 10, 15, 20, 25],
        [55, 50, 45, 40, 35, 30, 25, 20, 15, 10,  5,  0, 5, 10, 15, 20],
        [60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10,  5, 0,  5, 10, 15],
        [65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5,  0,  5, 10],
        [70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10,  5,  0,  5],
        [75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10,  5,  0]]

        this.carCallQueue = [];

    }

    run(requests, startingPoints) {
        this.requests = requests;
        this.startingPoints = startingPoints;
        let bestSolution = { cost: Infinity, tours: [] };
        this.pheromones = new Array(requests.length).fill(null).map(() => new Array(requests.length).fill(1))
        
        console.log(this.createSubSets(this.requests, this.startingPoints))
        for (let iteration = 0; iteration < this.nIterations; iteration++) {
            this.globalVisited.clear(); // Reset globalVisited at the start of each iteration
            for(let i=0; i<this.startingPoints.length; i++) {
                this.globalVisited.add(this.startingPoints[i])
            }
            let allTours = this.buildSolutions();
            this.updatePheromones(allTours);
            
            // Evaluate and possibly update the best solution
            let currentSolutionCost = this.evaluateSolution(allTours);
            if (currentSolutionCost < bestSolution.cost) {
                bestSolution = { cost: currentSolutionCost, tours: allTours };
            }
        }

        return  bestSolution;
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

        while (tour.length< this.subSets[antIndex].size) {
            let nextCity = this.selectNextCity(currentCity, this.globalVisited, antIndex);
            if (nextCity === -1) break; // No more cities to visit
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
    
        if (probabilities.length === 0) return -1; // No unvisited cities available
    
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

    createSubSets(requests ,startingPoints) {
        let subSets = new Array(startingPoints.length);
        for (let i = 0; i < subSets.length; i++) {
            subSets[i] = new Set();
        }
        for(let i=0; i<requests.length; i++) {

            let differences = startingPoints.map(start => Math.abs(start-requests[i]));
            // let minIndex = differences.reduce((r, v, i, a) => v > a[r] ? r : i, -1)
            let min = Math.min(...differences)
            let minIndexes = this.getAllIndexes(differences, min)
            let minIndex = minIndexes[Math.floor(Math.random()*minIndexes.length)]

            subSets[minIndex].add(requests[i])
        }

        this.subSets = subSets;
        return this.subSets;
    }

    getAllIndexes(arr, val) {
        var indexes = [], i;
        for(i = 0; i < arr.length; i++)
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



    generateDistanceMatrix(floors) {
        let uniqueFloors = [...new Set(floors)]
        let distances = [];
        // distances = uniqueFloors.map((floor) => this.matrix[floor-1])
        return distances;
    }

}
