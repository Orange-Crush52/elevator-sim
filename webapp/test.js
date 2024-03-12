function generateDistanceMatrix(numberOfFloors, floors) {
    let distances = [];

    for (let i = 0; i < numberOfFloors; i++) {
        // if(floors.indexOf(i)>=0) {
            distances[i] = []; // Initialize the ith row
            for (let j = 0; j < numberOfFloors; j++) {
                // The distance increases by 5 times the difference between city indices
                distances[i][j] = 5 * Math.abs(j - i);
            }
        // }
    }

    return distances.filter(function(value, index){return floors.indexOf(index)>=0});
}

// Example usage
let numberOfCities = 16; // Specify the number of cities

let distances = generateDistanceMatrix(numberOfCities, [0,1,2,3,4, 5,6,7, 8,9, 10,11,12,13,14,15]);
console.log(distances)
// for(let i=0; i<distances.length; i++) {
//     console.log(distances[i])
// }

distances = [[0,  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
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