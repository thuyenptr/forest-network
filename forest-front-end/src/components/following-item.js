import React, {Component} from 'react';
import {withRouter} from 'react-router-dom'
// const menu = (
//   <Menu>
//     <Menu.Item>
//       <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">Turn on mobile notification</a>
//     </Menu.Item>
//     <Menu.Item>
//       <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">Add or remove this twweet</a>
//     </Menu.Item>
//     <Menu.Item>
//       <a target="_blank" rel="noopener noreferrer" href="http://www.tmall.com/">Embed this porfile</a>
//     </Menu.Item>
//   </Menu>
// );

class FollowingItem extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="card" style={{width: '23rem'}}>
                <a className="card-img-top card-head" href="#">
                    {!!this.props.FollowItem.theme &&
                    <img className="card-img-top" src={this.props.FollowItem.theme}/>
                    }
                </a>
                <div className="card-body">
                    <div className="avatar">
                        <img src={`data:image/jpeg;base64,
                        ${this.props.FollowItem.avatar?this.props.FollowItem.avatar:'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}`}
                             alt="...."/>
                    </div>
                    <div className="card-action">
                        <button className="btn btn-primary" type="button">
                            <span>UnFollow</span>
                        </button>
                    </div>
                    <div className="card-userfield">
                        <div className="displayName">
                            {this.props.FollowItem.displayName ? this.props.FollowItem.displayName : "Unknown"}
                        </div>

                        <div className="userName">
                            <div
                                onClick={() => {
                                    this.props.history.push(`/${this.props.FollowItem.userName}`)
                                }}>
                                {this.props.FollowItem.userName}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(FollowingItem);
