/** Ant Colony Optimization for Elevator Dispatch */
class Brain {
    private readonly p: any;
    private readonly settings: any;
    private readonly activeIndex: any;
    private readonly idleIndex: any;
    private readonly requests: any[];
    private readonly stats: any;
    private carCallQueue: any[];


    private brain: any;

    constructor(p, settings, requests, activeIndex, idleIndex) {
        this.p = p;
        this.settings = settings;
        this.requests = requests;
        this.activeIndex = activeIndex;
        this.idleIndex = idleIndex;

        this.carCallQueue = [];

    }

    activeDistanceMatrix(car, floor) {
        
    }


    


}
