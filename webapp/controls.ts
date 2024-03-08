class Controls {
    private readonly p: any;
    private readonly settings: any;
    private stats: any;
    private readonly activeCarsChange: () => void;
    private paymentsChart: any;
    private waitChart: any;

    constructor(p, settings, stats) {
        this.p = p;
        this.settings = settings;
        this.stats = stats;
        this.activeCarsChange = () => {};
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

        const projection = 'Orthographic'
        // const projection = p.createSelect();
        // ['Orthographic'].forEach(p => projection.option(p));
        // projection.parent('#projectionParent');
        // projection.changed(() => settings.projectionType = projection.elt.selectedIndex);

        const controlMode = p.createSelect();
        ['Auto', 'Manual', 'Smart'].forEach(p => controlMode.option(p));
        controlMode.parent('#controlModeParent');
        controlMode.changed(() => settings.controlMode = controlMode.elt.selectedIndex);
        console.log(controlMode)
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

        this.paymentsChart = p.createGraphics(this.stats.maxRecentRiderPayments,
            15).parent('#paymentsChart');
        $('#paymentsChart canvas').show();

        // this.waitChart = p.createGraphics(this.stats.maxRecentRiderPayments,
        //     45).parent('#waitChart');
        // $('#waitChart canvas').show();
        
    }
}
