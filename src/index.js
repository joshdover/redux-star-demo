import React from 'react';
import ReactDOM from 'react-dom';
import { applyMiddleware, createStore, compose, bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import Immutable from 'immutable';

const ActionTypes = {
  GET_PAGE_START: 'GET_PAGE_START',
  GET_PAGE_END: 'GET_PAGE_END',
};

const ActionCreators = {
  getPageStart() {
    return {
      type: ActionTypes.GET_PAGE_START
    };
  },

  getPageEnd({ articles, success }) {
    return {
      type: ActionTypes.GET_PAGE_END,
      articles,
      success
    }
  },

  triggerGetPage: async function* (page = 0) {
      yield ActionCreators.getPageStart();

      try {
        let articles = await fetch(`/articles`);
        articles = await articles.json();
        yield ActionCreators.getPageEnd({
          articles: res.articles,
          success: true
        });
      } catch (e) {
        yield ActionCreators.getPageEnd({ success: false });
      }
  },
};

const initialState = Immutable.Map({
  currentArticle: null,
  loadingArticleList: false,
  articleList: []
});

function Reducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.GET_PAGE_START:
      return state
        .set('loadingArticleList', true);
    case ActionTypes.GET_PAGE_END:
      return state
        .set('loadingArticleList', false)
        .set('currentArticle', action.articles[0])
        .set('articleList', action.articles);
    default:
      return state;
  }
}

let ArticleList = React.createClass({
  componentWillMount() {
    this.props.triggerGetPage();
  },

  render() {
    return (
      <ul>
        {
          this.props.articles.map((article) => (
            <li key={ article.url }><a href={ article.url }>{ article.title }</a></li>
          ))
        }
      </ul>
    );
  }
});

ArticleList = connect(
  function mapStateToProps(state) {
    return {
      loading: state.get('articles').get('loadingArticleList'),
      articles: state.get('articles').get('articleList')
    };
  },
  function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch);
  }
)(ArticleList);

function asyncThunkMiddleware({ dispatch, getState }) {
  return function(next) {
    return async function (actionGen) {
      if (!Symbol.asyncIterator in g) {
        next();
      }

      for await (a of actionGen) {
        dispatch(a);
      }
    }
  }
}

const store = createStore(
  Reducer,
  Immutable.Map(),
  compose(
    asyncThunkMiddleware,
    window.devToolsExtension ? window.devToolsExtension(): f => f
  )
);

ReactDOM.render(
  <Provider store={ store }>
    <ArticleList />
  </Provider>,
  document.getElementById('root')
);
