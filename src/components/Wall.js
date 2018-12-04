import React, {Component} from 'react'
import Follow from "../containers/Follow";
import TweetBoard from '../containers/tweets-board';
import SideBar from '../containers/sidebar';
import FollowingList from '../containers/following';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';

export default class Wall extends Component {
    render() {
        return (
            <Switch>
                <Route
                    path="/following"
                    children={({ match }) => (
                        <div className={"main-content"}>
                            <div className={"sidebar-left"}>
                                <SideBar/>
                            </div>
                            <div className={"main-right"}>
                                <FollowingList/>
                            </div>
                        </div>
                    )}
                  />

                <Route
                    exact
                    path="/"
                    children={({ match }) => (
                      <div className={"main-content"}>
                        <div className={"sidebar-left"}>
                            <SideBar/>
                        </div>
                        <div className={"content"}>
                            <TweetBoard/>
                        </div>
                        <div className={"sidebar-right"}>
                            <Follow/>
                        </div>
                    </div>
                    )}
                  />
            </Switch>
        );
    }
}