
class AntColonyOptimizer {

    constructor(distances, nAnts, nBest, nIterations, decay, alpha=0.7, beta=1.1, tau=0.09) {
        this.distances = distances; // 2D array of distances between cities
        this.pheromones = new Array(distances.length).fill(null).map(() => new Array(distances.length).fill(1));
        this.nAnts = nAnts;
        this.nBest = nBest;
        this.nIterations = nIterations;
        this.decay = decay;
        this.alpha = alpha; // Pheromone importance
        this.beta = beta; // Distance importance
        this.tau = tau; // Bias towards unexplored paths, adjust as needed
        
    }

    run() {
        let all = []
        for (let iteration = 0; iteration < this.nIterations; iteration++) {
            let allTours = this.buildSolutions();
            this.updatePheromones(allTours);
            all.push(allTours)
        }

        // // After all iterations, you may want to retrieve the best solution found
        // // This part is left as an exercise: extracting and returning the best tour and its cost

        console.log(this.findBestTourBasedOnPheromones())

    }

    findBestTourBasedOnPheromones() {
        let tour = [];
        let visited = new Set();
        let currentCity = 0; // Starting at the first city, can be randomized or set to any specific start point
        tour.push(currentCity);
        visited.add(currentCity);
    
        while (tour.length < this.distances.length) {
            let nextCity = -1;
            let maxPheromone = -Infinity;
            for (let i = 0; i < this.distances.length; i++) {
                if (!visited.has(i) && this.pheromones[currentCity][i] > maxPheromone) {
                    maxPheromone = this.pheromones[currentCity][i];
                    nextCity = i;
                }
            }
            if (nextCity >= 0) { // Ensure a next city was found
                tour.push(nextCity);
                visited.add(nextCity);
                currentCity = nextCity;
            } else {
                // No unvisited city found, which should not happen in a well-formed problem
                break;
            }
        }
    
        // Optionally, return the tour and its total cost
        return {
            tour: tour,
            cost: this.findCost(tour)
        };
    }

    buildSolutions() {
        let allTours = [];
        for (let i = 0; i < this.nAnts; i++) {
            let tour = this.buildTour();
            allTours.push(tour);
        }
        return allTours;
    }

    buildTour() {
        let tour = [];
        let visited = new Set();
        // Start with a random city or a fixed start point
        // let startCity = Math.floor(Math.random() * this.distances.length);
        let startCity = 0;
        tour.push(startCity);
        visited.add(startCity);

        // Proceed to build the full tour for this ant
        for (let i = 1; i < this.distances.length; i++) {
            let city = this.selectNextCity(tour[tour.length - 1], visited);
            tour.push(city);
            visited.add(city);
        }

        // You may want to calculate the cost of the tour here and return it along with the tour
        return tour;
    }

    findCost(tour) {

        let cost = 0;
        for(let i=0; i<tour.length-1; i++){
            cost += this.distances[tour[i]][tour[i+1]]
        }
        return cost;
    }

    // selectNextCity(currentCity, visited) {
    //     // Implement the probabilistic selection of the next city based on pheromone levels and distances
    //     // This part is crucial and requires careful implementation of the ACO decision rule
    //     // Placeholder for your implementation
    //     return (currentCity + 1) % this.distances.length; // Simplistic placeholder logic
    // }

    selectNextCity(currentCity, visited) {
        let probabilities = [];
        let denominator = 0;
        
    
        for (let i = 0; i < this.distances.length; i++) {
            if (!visited.has(i)) {
                let pheromoneLevel = Math.pow(this.pheromones[currentCity][i], this.alpha);
                let heuristicValue = Math.pow(1 / this.distances[currentCity][i], this.beta);
                // Incorporate a small constant to ensure even unexplored paths have a chance to be selected
                let probability = pheromoneLevel * heuristicValue + this.tau;
                probabilities.push({city: i, probability: probability});
                denominator += probability;
            }
        }
    
        // Normalize probabilities
        probabilities = probabilities.map(p => ({ city: p.city, probability: p.probability / denominator }));
    
        // Use roulette wheel selection to choose the next city probabilistically
        let randomChoice = Math.random();
        let cumulativeProbability = 0;
        for (let prob of probabilities) {
            cumulativeProbability += prob.probability;
            if (randomChoice <= cumulativeProbability) {
                return prob.city;
            }
        }
    
        return -1; // Should never reach here if probabilities are calculated correctly
    }

    updatePheromones(allTours) {
        // Evaporate pheromones
        for (let i = 0; i < this.pheromones.length; i++) {
            for (let j = 0; j < this.pheromones[i].length; j++) {
                this.pheromones[i][j] *= (1 - this.decay);
            }
        }

        // Strengthen pheromones based on the tours of the best ants
        // Placeholder for adding pheromone: this is where you'd adjust pheromone levels based on the quality of each tour
        let sortedTours = allTours.map(tour => ({tour, cost: this.findCost(tour)}))
                              .sort((a, b) => a.cost - b.cost);

    // Strengthen pheromones based on the tours of the best ants
    for (let i = 0; i < Math.min(this.nBest, sortedTours.length); i++) {
        let tour = sortedTours[i].tour;
        let additionalPheromone = 1 / sortedTours[i].cost; // Example pheromone addition strategy
        for (let j = 0; j < tour.length - 1; j++) {
            let from = tour[j];
            let to = tour[j + 1];
            this.pheromones[from][to] += additionalPheromone;
            this.pheromones[to][from] += additionalPheromone; // Assuming undirected graph (symmetric)
        }
    }
    }
}

// Example usage
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
let aco = new AntColonyOptimizer(distances, 5, 2, 500, 0.5);
aco.run();
