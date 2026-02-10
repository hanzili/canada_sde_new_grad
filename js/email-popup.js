(function() {
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUAl5EepxfX39GOK6bsD_6XOGdDCcD7LMips2J84dSP8RKc_TP8WZAS1tRDRhzQ9xtOA/exec';

    var DISMISS_KEY = 'email_popup_dismissed_at';
    var SUBMIT_KEY = 'email_popup_submitted';
    var ONE_DAY = 24 * 60 * 60 * 1000;

    function shouldShow() {
        if (localStorage.getItem(SUBMIT_KEY)) return false;
        var dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed && (Date.now() - Number(dismissed)) < ONE_DAY) return false;
        return true;
    }

    function show() {
        var el = document.getElementById('emailPopup');
        if (el) el.style.display = '';
    }

    function hide() {
        var el = document.getElementById('emailPopup');
        if (el) el.style.display = 'none';
    }

    function dismiss() {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        hide();
    }

    function onSubmit(e) {
        e.preventDefault();
        var btn = document.getElementById('emailSubmitBtn');
        var email = document.getElementById('emailInput').value.trim();
        if (!email) return;

        var roles = [];
        document.querySelectorAll('#emailForm input[name="role"]:checked').forEach(function(cb) {
            roles.push(cb.value);
        });
        var seniority = [];
        document.querySelectorAll('#emailForm input[name="seniority"]:checked').forEach(function(cb) {
            seniority.push(cb.value);
        });
        var missing = (document.getElementById('emailMissing').value || '').trim();

        btn.disabled = true;
        btn.textContent = 'Submitting...';

        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                email: email,
                preferences: roles,
                seniority: seniority,
                missing: missing
            })
        }).then(function() {
            localStorage.setItem(SUBMIT_KEY, '1');
            document.getElementById('emailPopupForm').style.display = 'none';
            document.getElementById('emailPopupSuccess').style.display = '';
            setTimeout(hide, 2500);
        }).catch(function() {
            btn.disabled = false;
            btn.textContent = 'Subscribe';
            alert('Something went wrong. Please try again.');
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Always attach event listeners so the form works regardless of how popup is shown
        document.getElementById('emailPopupClose').addEventListener('click', dismiss);

        document.getElementById('emailPopup').addEventListener('click', function(e) {
            if (e.target === this) dismiss();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('emailPopup').style.display !== 'none') {
                dismiss();
            }
        });

        document.getElementById('emailForm').addEventListener('submit', onSubmit);

        // Only auto-show on eligible visits
        if (shouldShow()) {
            setTimeout(show, 30000);
        }
    });
})();
