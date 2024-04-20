const canvas = document.getElementById('myCanvas');
const context = canvas.getContext('2d');
canvas.addEventListener('mousedown', handleMouseDown);
let mutationRate = document.getElementById("mutationRate").value;
let populationSize = document.getElementById("populationSize").value;
let maxGenerations = document.getElementById("maxGenerations").value;
let pop;
let bestPathever;
let points = [];

//هذه الدالة تُستدعى عند النقر على اللوحة الزرقاء (Canvas) لإضافة نقطة جديدة.
function handleMouseDown(event) {
    let x = event.clientX - canvas.offsetLeft;
    let y = event.clientY - canvas.offsetTop;
    context.fillStyle = 'black';
    context.beginPath();
    context.arc(x - 8, y - 8, 5, 0, Math.PI * 2);
    context.fill();
    points.push([x, y]);
}

//هذه الدالة تقوم بإنشاء مجموعة من الفرد (population)، حيث يتم توليد كل فرد بترتيب عشوائي للمدن.
function createPopulation(populationSize, cities) {
    const population = [];
    for (let i = 0; i < populationSize; i++) {
        // Shuffle the cities to create a random order
        const individual = cities.slice();
        for (let j = individual.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [individual[j], individual[k]] = [individual[k], individual[j]];
        }
        population.push(individual);
    }
    return population;
}

//هذه الدالة تحسب قيمة اللياقة (fitness) لكل فرد في المجموعة. في هذه الحالة، تُقيّم اللياقة كفاءة مسار السفر بين المدن.
function calcFitness(pattern) {
    let totalDistance = 0;
    for (let i = 0; i < pattern.length - 1; i++) {
        const cityA = pattern[i];
        const cityB = pattern[i + 1];
        const dx = cityB[0] - cityA[0];
        const dy = cityB[1] - cityA[1];
        totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    return 100 / totalDistance;
}

//هذه الدالة تستخدم للعثور على الفرد الأفضل (الأكثر تميزاً) في المجموعة.
function getFittest(cities) {
    let fittest = cities[0];
    let maxFitness = calcFitness(fittest);
    for (let i = 1; i < cities.length; i++) {
        const fitness = calcFitness(cities[i]);
        if (fitness > maxFitness) {
            fittest = cities[i];
            maxFitness = fitness;
        }
    }
    return fittest;
}

//هذه الدالة تقوم بإجراء عملية التلاقي (crossover) بين فردين (parents) لإنشاء فرد جديد (offspring).
function crossover(parentA, parentB) {
    const offspring = new Array(parentA.length);
    let start = Math.floor(Math.random() * parentA.length);
    let end = Math.floor(Math.random() * parentA.length);

    while (start === end) {
        start = Math.floor(Math.random() * parentA.length);
        end = Math.floor(Math.random() * parentA.length);
    }
    // Make sure start and end are different
    if (start !== end) {
        // Swap start and end if start is greater than end
        if (start > end) {
            const temp = start;
            start = end;
            end = temp;
        }

        // Copy cities from parentA to offspring
        for (let i = start; i <= end; i++) {
            offspring[i] = parentA[i];
        }

        // Copy cities from parentB to offspring
        let j = 0;
        for (let i = 0; i < offspring.length; i++) {
            if (offspring[i] === undefined) {
                // Find first city in parentB that is not already in offspring
                while (offspring.includes(parentB[j])) {
                    j++;
                }
                offspring[i] = parentB[j];
            }
        }
    }

    return offspring;
}


//هذه الدالة تُستخدم لتحديث الفرد بنسبة معينة معدل التغيير (mutation rate).
function mutate(pattern) {
    for (let i = 0; i < pattern.length; i++) {
        if (Math.random() < mutationRate) {
            const j = Math.floor(Math.random() * pattern.length);
            const temp = pattern[i];
            pattern[i] = pattern[j];
            pattern[j] = temp;
        }
    }
}

//هذه الدالة تُستخدم لترتيب المجموعة بناءً على قيم اللياقة لكل فرد.
function sortPopulationByFitness(population) {
    population.sort((a, b) => calcFitness(a) - calcFitness(b));
}

//هذه الدالة تُستخدم لرسم خط بين النقاط المحددة.
function drawLineThroughPoints(ctx, dots) {
    if (dots.length < 2) {
        return;
    }

    // Move the pen to the first point
    ctx.beginPath();
    ctx.moveTo(dots[0][0] - 8, dots[0][1] - 8);

    // Draw a line to each subsequent point
    for (let i = 1; i < dots.length; i++) {
        ctx.lineTo(dots[i][0] - 8, dots[i][1] - 8);
    }
    // Close the path to connect the last point back to the first point
    ctx.closePath();
    ctx.strokeStyle = '#77cc6d';
    ctx.lineWidth = 3;
    // Stroke the path to draw the line
    ctx.stroke();
}

//هذه الدالة تقوم برسم النقاط على اللوحة الزرقاء.
function drawPoints(ctx, dots) {
    ctx.fillStyle = 'black';
    ctx.moveTo(dots[0][0], dots[0][1]);
    for (let i = 0; i < dots.length; i++) {
        const x = dots[i][0];
        const y = dots[i][1];
        ctx.beginPath();
        ctx.arc(x - 8, y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

//هذه الدالة تقوم برسم المسار الذي يمر عبر النقاط المحددة.
function drawPath(ctx, path) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawLineThroughPoints(ctx, path)
    drawPoints(ctx, points);
}

//هذه الدالة تُستخدم لتحريك العرض لرسم مسار السفر بين المدن.
function animatepath(context, path) {
    // Initialize animation variables
    let animationFrame = 0;
    const maxFrames = 100;

    // Start the animation loop
    const animationLoop = setInterval(() => {
        // Draw pheromone trails on canvas
        drawPath(context, path);
        // Check if the animation has completed
        if (++animationFrame >= maxFrames) {
            // Stop the animation loop
            clearInterval(animationLoop);
        }
    }, 1000 / 60); // 60 frames per second
}

//هذه الدالة تُشغّل عملية خوارزمية العمليات الوراثية لحل المسألة، حيث يتم توليد وتقييم الفراد واختيار الأفضل والتلاقي والتطور وهكذا حتى يتحقق الانتقال إلى الجيل الجديد بعدد محدد من المرات.
function startButton() {
    mutationRate = document.getElementById("mutationRate").value;
    populationSize = document.getElementById("populationSize").value;
    maxGenerations = document.getElementById("maxGenerations").value;

    pop = createPopulation(populationSize, points);
    let generationCount = 0;
    let convergance = 0;
    bestPathever = points;
    sortPopulationByFitness(pop);
    while (generationCount < maxGenerations && convergance < maxGenerations / 2) {
        let parents = [];
        let i = 0, j = i + 1;

        while (parents.length < populationSize) {
            for (let i = populationSize - 1; i > populationSize / 2; i--) {
                parents.push(pop[i])
            }
            if (populationSize - 1 - i === 0) {
                break;
            }
            if (populationSize - 1 - j === 0) {
                i++;
                j = i + 1;
            }
            let offspring = crossover(pop[populationSize - 1 - i], pop[populationSize - 1 - j]);
            if (offspring.length === points.length) {
                parents.push(offspring);
            }
            j++;
        }
        sortPopulationByFitness(parents);
        for (let i = 0; i < parents.length / 2; i++) {
            mutate(parents[i]);
        }
        sortPopulationByFitness(parents);
        pop = parents;
        let bestPathG = pop[populationSize - 1];
        if (calcFitness(bestPathG) - calcFitness(bestPathever) > 0) {
            bestPathever = bestPathG;
            convergance = 0;
        }
        convergance++;
        generationCount++;
        if (generationCount % 100 === 0) {
            animatepath(context, bestPathever);
            console.log(calcFitness(bestPathever));
        }
    }
}

//هذه الدالة تقوم بمسح جميع النقاط الموجودة على اللوحة الزرقاء.
function clearButton() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
}