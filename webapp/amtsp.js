class AntColonyMTSP {
    constructor(distances, nAnts, nBest, nIterations, decay, startingPoints, alpha=0.7, beta=1.1, tau=0.1) {
        this.distances = distances;
        this.pheromones = new Array(distances.length).fill(null).map(() => new Array(distances.length).fill(1));
        this.nAnts = nAnts;
        this.nBest = nBest;
        this.nIterations = nIterations;
        this.decay = decay;
        this.alpha = alpha; // Pheromone importance
        this.beta = beta; // Distance importance
        this.tau = tau; // Bias towards unexplored paths
        this.startingPoints = startingPoints; // Predetermined starting points for each salesman
        this.globalVisited = new Set(); // Global tracking of visited cities
    }

    run() {
        let bestSolution = { cost: Infinity, tours: [] };
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

        console.log("Best Solution:", bestSolution);
    }

    evaluateSolution(allTours) {
        // This function sums up the costs of all tours to find the total cost
        let totalCost = allTours.reduce((acc, tour) => acc + this.findCost(tour), 0);
        return totalCost;
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
        while (this.globalVisited.size < this.distances.length) {
            let nextCity = this.selectNextCity(currentCity, this.globalVisited);
            if (nextCity === -1) break; // No more cities to visit
            tour.push(nextCity);
            this.globalVisited.add(nextCity);
            currentCity = nextCity;
        }
        return tour;
    }

    selectNextCity(currentCity, globalVisited) {
        let probabilities = [];
        let denominator = 0;
    
        for (let i = 0; i < this.distances.length; i++) {
            if (!globalVisited.has(i)) {
                let pheromoneLevel = Math.pow(this.pheromones[currentCity][i], this.alpha);
                let heuristicValue = Math.pow(1 / (this.distances[currentCity][i] + this.tau), this.beta);
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
            cost += this.distances[tour[i]][tour[i + 1]];
        }
        return cost;
    }

    // You may want to implement findBestToursBasedOnPheromones if necessary
}

// Example usage (adjust according to your scenario)
let distances = [[0, 10, 15, 20, 25, 30, 35, 40, 45, 50], //distance of city 0 to all other cities
                [10, 0, 5, 10, 15, 20, 25, 30, 35, 40],//distance of city 1 to all other cities
                [15, 5, 0, 5, 10, 15, 20, 25, 30, 35],//distance of city 2 to all other cities
                [20, 10, 5, 0, 5, 10, 15, 20, 25, 30],//distance of city 3 to all other cities
                [25, 15, 10, 5, 0, 5, 10, 15, 20, 25],//distance of city 4 to all other cities
                [30, 20, 15, 10, 5, 0, 5, 10, 15, 20],//distance of city 5 to all other cities
                [35, 25, 20, 15, 10, 5, 0, 5, 10, 15],//distance of city 6 to all other cities
                [40, 30, 25, 20, 15, 10, 5, 0, 5, 10],//distance of city 7 to all other cities
                [45, 35, 30, 25, 20, 15, 10, 5, 0, 5],//distance of city 8 to all other cities
                [50, 40, 35, 30, 25, 20, 15, 10, 5, 0]]; // Replace with your actual distances matrix
let startingPoints = [0, 2, 4, 6, 8]; // Example starting points for each salesman
let aco = new AntColonyMTSP(distances, 5, 2, 100, 0.5, startingPoints, 1, 2, 0.1);
aco.run();
