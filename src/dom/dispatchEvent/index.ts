import eventTargetPType from './orig';
import { ApplyHandler, ApplyOption, wrapMethod } from '../../proxy';
import { retrieveEvent, verifyEvent, verifyCurrentEvent } from '../../events/verify';
import examineTarget from '../../events/examine-target';
import { setBeforeunloadHandler } from '../unload';
import abort from '../../abort';
import * as log from '../../log';
import bridge from '../../bridge';
import { createAlertInTopFrame } from '../../messaging';
import createUrl from '../../url';

const dispatchVerifiedEvent:ApplyHandler = function(_dispatchEvent, _this, _arguments) {
    let evt = _arguments[0];
    if ('clientX' in evt && _this.nodeName.toLowerCase() == 'a' && !evt.isTrusted) {
        log.call('It is a MouseEvent on an anchor tag.');
        // Checks if an url is in a whitelist
        let url = createUrl(_this.href);
        let destDomain = url.canonical;
        if (bridge.whitelistedDestinations.indexOf(destDomain) !== -1) {
            log.print(`The domain ${destDomain} is in whitelist.`);
            return _dispatchEvent.call(_this, evt);
        }
        let currentEvent = retrieveEvent();
        if (!verifyEvent(currentEvent)) {
            log.print('It did not pass the test, not dispatching event');
            createAlertInTopFrame(bridge.domain, url.display, false);
            examineTarget(currentEvent, _this.href);
            log.callEnd();
            return false;
            // Or, we may open a new widnow with window.open to save a reference and do additional checks.
        }
        log.print("It passed the test");
        log.callEnd();
    }
    return _dispatchEvent.call(_this, evt);
};

const isUIEvent:ApplyOption = (target, _this, _arguments) => {
    return 'view' in _this;
};

wrapMethod(eventTargetPType, 'dispatchEvent', dispatchVerifiedEvent, isUIEvent);
