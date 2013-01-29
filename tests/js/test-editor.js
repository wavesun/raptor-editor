if (typeof window.testResults === 'undefined') {
    window.testResults = {
        count: 0,
        tests: [],
        finished: false
    };
}

var testQueue = []
    running = false;

function testEditor(container, action) {
    if ($(container).length !== 1) {
        throw new Error('Duplicate or missing container: ' + container);
        return;
    }
    testQueue.push([container, action]);
}

function runTest(container, action) {
    running = true;

    var input = $(container).find('.test-input');
    var html = input.html();
    var output = $('<div>').addClass('test-output').html(html).appendTo(container);
    var diff = $('<div>').addClass('test-diff').appendTo(container);
    var expected = $(container).find('.test-expected');
    output.find('.editible').raptor({
        autoEnable: true,
        urlPrefix: '../../../src/',
        plugins: {
            save: {
                plugin: null
            },
            saveJson: {
                url: 'save.php',
                postName: 'raptor-content',
                id: function() {
                    return this.raptor.getElement().data('id');
                }
            },
            saveRest: {
                url: 'save.php',
                data: function(html) {
                    return {
                        id: this.raptor.getElement().data('id'),
                        content: html
                    };
                }
            },
            classMenu: {
                classes: {
                    'Blue background': 'cms-blue-bg',
                    'Round corners': 'cms-round-corners',
                    'Indent and center': 'cms-indent-center'
                }
            }
        }
    });

    var inputSource = $('<div>')
        .addClass('test-source test-box test-input-source')
        .insertAfter(input);
    applyCodeMirror(inputSource.get(0), input.find('.editible').html());
    input.addClass('test-box');
    $('<div>').addClass('test-clear').insertAfter(inputSource);

    var expectedSource = $('<div>')
        .addClass('test-source test-box test-expected-source')
        .insertAfter(expected);
    applyCodeMirror(expectedSource.get(0), expected.find('.editible').html());
    expected.addClass('test-box');
    $('<div>').addClass('test-clear').insertAfter(expectedSource);

    setTimeout(function() {
        var ranges = tokensToRanges(output.find('.editible'));
        rangy.getSelection().setRanges(ranges);

        var error;
        try {
            action(output);
        } catch (e) {
            console.error(e);
            console.error(e.stack);
            error = e;
        }

        output = $(container).find('.test-output');
        var outputSource = $('<div>')
            .addClass('test-source test-box test-output-source')
            .insertAfter(output);
        applyCodeMirror(outputSource.get(0), output.find('.editible').html());
        output.addClass('test-box');
        $('<div>').addClass('test-clear').insertAfter(outputSource);

        if (error) {
            var expectedHTML = style_html(expected.find('.editible').html());
            var actualHTML = style_html(output.find('.editible').html());
            if (actualHTML !== expectedHTML) {
                diff.html(diffstr(expectedHTML, actualHTML));
            }
            $('<pre class="error-output">').text(error).appendTo(diff);
            $('<pre class="error-output">').text(error.stack).appendTo(diff);
            window.testResults.tests.push({
                status: 'fail',
                type: 'error',
                error: error
            });
            fail(container);
        } else {
            var expectedHTML = style_html(expected.find('.editible').html());
            var actualHTML = style_html(output.find('.editible').html());

            diff.html(diffstr(expectedHTML, actualHTML));
            if (actualHTML !== expectedHTML) {
                window.testResults.tests.push({
                    status: 'fail',
                    type: 'diff',
                    diff: diff,
                    expectedHTML: expectedHTML,
                    actualHTML: actualHTML
                });
                fail(container);
            } else {
                window.testResults.tests.push({
                    status: 'pass'
                });
                pass(container);
            }
        }
        running = false;
    }, 50);

    window.testResults.count++;
}

(function() {
    var timer;
    timer = setInterval(function() {
        if (running === false && testQueue.length > 0) {
            var test = testQueue.shift();
            runTest(test[0], test[1]);
        }
        if (testQueue.length === 0) {
            window.testResults.finished = true;
        }
    }, 20);
})();

function getRaptor(input) {
    return input.find('.editible').data('uiRaptor');
}

function getLayoutElement(input) {
    return getRaptor(input).getLayout().getElement();
}

function clickButton(input, button) {
    return getLayoutElement(input).find(button).trigger('click');
}